// content/youtube.js
(() => {
  const state = {
    isYouTube: location.host.includes('youtube.com'),
    videoId: null,
    channelName: null,
    channelHandle: null, // ex.: "@alanzoka"
    channelId: null,     // ex.: "UC..."
    isPlaying: false,
    like: null,          // true/false/null
    dislike: null,       // true/false/null
    subscribed: null,    // true/false/null
    watchSeconds: 0,
    recent: []           // {type, at, extra?}
  };

  // ===== helpers =====
  const nowIso = () => new Date().toISOString();
  const pushRecent = (r) => {
    state.recent.unshift({ at: nowIso(), ...r });
    state.recent = state.recent.slice(0, 10);
    notifyPopup();
  };

  const throttle = (fn, ms) => {
    let t = 0;
    return (...args) => {
      const n = Date.now();
      if (n - t >= ms) { t = n; fn(...args); }
    };
  };
  const notifyPopupThrottled = throttle(() => notifyPopup(), 300);

  function notifyPopup() {
    try {
    chrome.runtime?.sendMessage?.({ type: "UPDATE_FROM_YT", state });
  } catch (_) {
    // ignore se o contexto do service worker foi reiniciado
  }
  }

  // ===== extractors =====
  function getVideoIdFromUrl() {
    const u = new URL(location.href);
    return u.searchParams.get('v') || null;
  }

  function queryChannelName() {
    const a = document.querySelector('ytd-video-owner-renderer #channel-name a');
    return a?.textContent?.trim() || null;
  }

  function queryChannelHandle() {
    const a = document.querySelector('ytd-video-owner-renderer a[href*="/@"]');
    if (!a?.href) return null;
    const m = a.href.match(/\/@([^/?#]+)/);
    return m ? `@${m[1]}` : null;
  }

  function queryChannelId() {
    const nearOwner = document.querySelector(
      'ytd-video-owner-renderer a[href*="/channel/"], ' +
      '#description a[href*="/channel/"], ' +
      'ytd-watch-metadata a[href*="/channel/"]'
    );
    if (nearOwner?.href) {
      const m = nearOwner.href.match(/\/channel\/(UC[\w-]+)/);
      if (m) return m[1];
    }
    // fallback leve: procurar "browseId":"UC..."
    const scripts = Array.from(document.querySelectorAll('script')).slice(0, 60);
    for (const el of scripts) {
      const txt = el.textContent || '';
      const m = txt.match(/"browseId":"(UC[\w-]+)"/);
      if (m) return m[1];
    }
    return null;
  }

  function queryLikeBtn() {
    return document.querySelector('like-button-view-model button');
  }
  function queryDislikeBtn() {
    return document.querySelector('dislike-button-view-model button');
  }
  function readToggle(btn) {
    const val = btn?.getAttribute('aria-pressed');
    return val === 'true' ? true : val === 'false' ? false : null;
  }
  function queryVideoEl() {
    return document.querySelector('video');
  }

  // ===== subscribe =====
  function querySubscribed() {
    const btn = document.querySelector(
      'ytd-subscribe-button-renderer yt-button-shape button,' +
      'ytd-subscribe-button-renderer tp-yt-paper-button'
    );
    if (!btn) return null;

    const text = btn.textContent?.trim().toLowerCase() || '';
    const label = (btn.getAttribute('aria-label') || '').toLowerCase();

    const reSubscribed = /(inscrito|subscribed|abonado|登録済|inscrit)/i;
    const reSubscribe  = /(inscrever|subscribe|abonar|登録|s’abonner)/i;

    if (reSubscribed.test(text) || /cancelar inscrição|unsubscribe|cancel subscription/i.test(label)) return true;
    if (reSubscribe.test(text)  || /inscreva-se|subscribe to/i.test(label)) return false;

    const pressed = btn.getAttribute('aria-pressed');
    if (pressed === 'true')  return true;
    if (pressed === 'false') return false;

    return null;
  }

  function wireSubscribeButton() {
    const host = document.querySelector('ytd-subscribe-button-renderer');
    if (!host || host._ytPresenceWired) return;
    host._ytPresenceWired = true;

    // 1) clique no botão
    host.addEventListener('click', () => {
      setTimeout(checkAndRecordSubscribeChange, 120);
    }, { passive: true, capture: true });

    // 2) mudança de DOM (texto/atributos) — cobre casos sem clique direto
    const mo = new MutationObserver(() => {
      checkAndRecordSubscribeChange();
    });
    mo.observe(host, { childList: true, subtree: true, attributes: true, characterData: true });

    function checkAndRecordSubscribeChange() {
      const before = state.subscribed;
      state.subscribed = querySubscribed();
      if (before !== state.subscribed && state.subscribed != null) {
        pushRecent({ type: state.subscribed ? 'subscribe' : 'unsubscribe' });
        chrome.runtime.sendMessage({ type: "YTD_INTERACTION", kind: state.subscribed ? 'subscribe' : 'unsubscribe' });
      } else {
        notifyPopup();
      }
    }
  }

  // ===== watch-time (segundos) =====
  let watchAccumulatedSec = 0;
  let watchStartMs = null;
  let ticker = null;

  function startTicker() {
    if (ticker) return;
    ticker = setInterval(() => {
      if (watchStartMs != null) {
        const elapsedSec = (Date.now() - watchStartMs) / 1000;
        state.watchSeconds = Math.floor(watchAccumulatedSec + elapsedSec);
        notifyPopupThrottled();
      }
    }, 500);
  }
  function stopTicker() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function onPlay() {
    if (watchStartMs == null) watchStartMs = Date.now();
    state.isPlaying = true;
    startTicker();
    notifyPopup();
  }
  function onPauseOrEnded() {
    if (watchStartMs != null) {
      watchAccumulatedSec += (Date.now() - watchStartMs) / 1000;
      watchStartMs = null;
    }
    state.isPlaying = false;
    state.watchSeconds = Math.floor(watchAccumulatedSec);
    stopTicker();
    notifyPopup();
  }

  // zera ao trocar de vídeo
  let lastVideoId = null;
  function handleVideoChange(newVideoId) {
    if (newVideoId !== lastVideoId) {
      lastVideoId = newVideoId;
      watchAccumulatedSec = 0;
      watchStartMs = null;
      state.watchSeconds = 0;
      stopTicker();
    }
  }

  // ===== heart-beat (corrige "só começa ao trocar de aba") =====
  // A cada 1s, sincroniza estado com o <video> mesmo que eventos falhem.
  setInterval(() => {
    const v = queryVideoEl();
    if (!v) return;

    const actuallyPlaying = !!(!v.paused && !v.ended && v.readyState >= 2);
    if (actuallyPlaying && watchStartMs == null) {
      onPlay(); // liga ticker e status
    } else if (!actuallyPlaying && watchStartMs != null) {
      onPauseOrEnded(); // consolida tempo e para ticker
    } else {
      // apenas atualiza watchSeconds para a UI se estiver tocando
      if (watchStartMs != null) {
        const elapsedSec = (Date.now() - watchStartMs) / 1000;
        state.watchSeconds = Math.floor(watchAccumulatedSec + elapsedSec);
        notifyPopupThrottled();
      }
    }
  }, 1000);

  // ===== main refresh =====
  function refreshAll() {
    const newVideoId = getVideoIdFromUrl();
    handleVideoChange(newVideoId);

    state.videoId       = newVideoId;
    state.channelName   = queryChannelName();
    state.channelHandle = queryChannelHandle();
    state.channelId     = queryChannelId();
    state.subscribed    = querySubscribed();

    const likeBtn = queryLikeBtn();
    const dislikeBtn = queryDislikeBtn();
    state.like = readToggle(likeBtn);
    state.dislike = readToggle(dislikeBtn);

    const v = queryVideoEl();
    state.isPlaying = !!(v && !v.paused && !v.ended);

    if (watchStartMs != null) {
      state.watchSeconds = Math.floor(watchAccumulatedSec + (Date.now() - watchStartMs) / 1000);
    } else {
      state.watchSeconds = Math.floor(watchAccumulatedSec);
    }

    notifyPopup();
  }

  // ===== wires =====
  function wireVideoEvents() {
    const v = queryVideoEl();
    if (!v || v._ytPresenceWired) return;
    v._ytPresenceWired = true;

    v.addEventListener('play', onPlay);
    v.addEventListener('playing', onPlay);
    v.addEventListener('pause', onPauseOrEnded);
    v.addEventListener('ended', onPauseOrEnded);
    v.addEventListener('loadeddata', () => { /* noop */ }, { passive: true });

    // "seeking" não afeta (medimos relógio)
    v.addEventListener('seeking', () => {}, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !v.paused) onPauseOrEnded();
      else if (!document.hidden && !v.paused && !v.ended) onPlay();
    });
  }

  function wireLikeDislike() {
    const likeBtn = queryLikeBtn();
    const dislikeBtn = queryDislikeBtn();

    if (likeBtn && !likeBtn._ytPresenceWired) {
      likeBtn._ytPresenceWired = true;
      likeBtn.addEventListener('click', () => {
        state.like = readToggle(likeBtn);
        if (state.like === true) {
          pushRecent({ type: 'like' });
          chrome.runtime.sendMessage({ type: "YTD_INTERACTION", kind: 'like' });
        } else if (state.like === false) {
          pushRecent({ type: 'unlike' });
          chrome.runtime.sendMessage({ type: "YTD_INTERACTION", kind: 'unlike' });
        }
        notifyPopup();
      }, { passive: true });
    }
    if (dislikeBtn && !dislikeBtn._ytPresenceWired) {
      dislikeBtn._ytPresenceWired = true;
      dislikeBtn.addEventListener('click', () => {
        state.dislike = readToggle(dislikeBtn);
        if (state.dislike === true) {
          pushRecent({ type: 'dislike' });
          chrome.runtime.sendMessage({ type: "YTD_INTERACTION", kind: 'dislike' });
        } else if (state.dislike === false) {
          pushRecent({ type: 'undislike' });
          chrome.runtime.sendMessage({ type: "YTD_INTERACTION", kind: 'undislike' });
        }
        notifyPopup();
      }, { passive: true });
    }
  }

  function wireCommentsPoC() {
    const root = document.querySelector('ytd-comments');
    if (!root || root._ytPresenceWired) return;
    root._ytPresenceWired = true;

    root.addEventListener('click', (ev) => {
      const btn = ev.target.closest('ytd-button-renderer, tp-yt-paper-button, button');
      if (!btn) return;
      if (btn.closest('ytd-commentbox, ytd-comment-simplebox-renderer, #input, #composer') || btn.id === 'submit-button') {
        pushRecent({ type: 'comment' });
        chrome.runtime.sendMessage({ type: "YTD_INTERACTION", kind: 'comment_submitted' });
      }
    }, { passive: true, capture: true });
  }

  function wireSpaNavigation() {
    const reapply = () => {
      refreshAll();
      wireVideoEvents();
      wireLikeDislike();
      wireCommentsPoC();
      wireSubscribeButton();
    };
    window.addEventListener('yt-navigate-finish', reapply);
    window.addEventListener('yt-page-data-updated', reapply);
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.addedNodes?.length) {
          if ([...m.addedNodes].some(n =>
              n.querySelector?.('ytd-video-owner-renderer, like-button-view-model, dislike-button-view-model, ytd-comments, ytd-subscribe-button-renderer'))) {
            reapply();
            break;
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // ===== métrica pronta pro backend =====
  function collectMetrics() {
    return {
      at: nowIso(),
      videoId: state.videoId,
      channelName: state.channelName,
      channelHandle: state.channelHandle,
      channelId: state.channelId,
      subscribed: state.subscribed,          // true/false/null
      like: state.like,                      // true/false/null
      dislike: state.dislike,                // true/false/null
      watchSeconds: state.watchSeconds,      // inteiro
      recent: [...state.recent],             // últimas 10 ações
    };
  }

  // responde o popup e quem mais pedir
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'get_status') {
      refreshAll();
      sendResponse({ ok: true, state });
      return true;
    }
    if (msg?.type === 'GET_METRICS') {
      // não faz refresh completo pra ser rápido; garante watchSeconds correto
      if (watchStartMs != null) {
        state.watchSeconds = Math.floor(watchAccumulatedSec + (Date.now() - watchStartMs) / 1000);
      }
      sendResponse({ ok: true, data: collectMetrics() });
      return true;
    }
  });

  // boot
  refreshAll();
  wireVideoEvents();
  wireLikeDislike();
  wireCommentsPoC();
  wireSubscribeButton();
  wireSpaNavigation();
})();
