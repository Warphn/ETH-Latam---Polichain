const SITE_ORIGIN = "http://localhost:3000";
const WEBHOOK_URL = `${SITE_ORIGIN}/api/webhooks/youtube-presence`;
const POLL_MS = 10_000;

let lastReauthAt = 0;

function triggerReauth() {
  const now = Date.now();
  // anti-loop: evita abrir mil abas se várias chamadas falharem
  if (now - lastReauthAt < 10_000) return;
  lastReauthAt = now;

  chrome.storage.local.remove(["baseAuth"], () => {
    const url = `${SITE_ORIGIN}/login?ext=${chrome.runtime.id}`;
    chrome.tabs.create({ url });
  });
}

async function getAuth() {
  const { baseAuth } = await chrome.storage.local.get(["baseAuth"]);
  return baseAuth || null;
}

async function pickYouTubeTab() {
  const active = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active?.[0]?.url?.includes("youtube.com")) return active[0];
  const any = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
  return any?.[0] || null;
}

async function askMetrics(tabId) {
  return new Promise((resolve) => {
    if (!tabId) return resolve(null);
    try {
      chrome.tabs.sendMessage(tabId, { type: "GET_METRICS" }, (resp) => {
        const err = chrome.runtime.lastError;
        if (err) return resolve(null);
        resolve(resp);
      });
      setTimeout(() => resolve(null), 1500);
    } catch {
      resolve(null);
    }
  });
}

async function collectAndMaybeSend() {
  const auth = await getAuth();
  if (!auth?.token) return;

  const tab = await pickYouTubeTab();
  if (!tab?.id) return;

  const metricsResp = await askMetrics(tab.id);
  if (!metricsResp?.ok) return;
  const m = metricsResp.data;

  const isYouTube = m?.isYouTube === true || (tab.url || "").includes("youtube.com");
  const watchedEnough = (m?.watchSeconds ?? 0) >= 15;
  const liked = m?.like === true;
  const commented = Array.isArray(m?.recent) && m.recent.some(r => r.type === "comment");

  if (!(isYouTube && watchedEnough && liked && commented)) return;

  // de-dup por vídeo (local)
  const key = `ytPresenceSent`;
  const store = (await chrome.storage.local.get([key]))[key] || {};
  if (m.videoId && store[m.videoId]) return;

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth.token}`,
      },
      body: JSON.stringify(m),
    });

    // → reauth ao 401 (token inválido/expirado) ou payload com action: reauth
    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch {}
      if (res.status === 401 || data?.action === "reauth") {
        triggerReauth();
      }
      return;
    }

    // sucesso → marca dedupe
    if (m.videoId) {
      store[m.videoId] = { at: Date.now() };
      const entries = Object.entries(store).slice(-100);
      const trimmed = Object.fromEntries(entries);
      await chrome.storage.local.set({ [key]: trimmed });
    }
  } catch (e) {
    // network falhou; tenta na próxima
  }
}

setInterval(collectAndMaybeSend, POLL_MS);

// recebe token do site (sem mudanças)
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "BASE_LOGIN_DONE") {
    const { address, token } = msg;
    chrome.storage.local.set({ baseAuth: { address, token, at: Date.now() } }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
