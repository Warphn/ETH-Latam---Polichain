const SITE_ORIGIN = "https://eth-latam-polichain-nextjs-lac.vercel.app/";

document.getElementById("btn-login").addEventListener("click", () => {
  const url = `${SITE_ORIGIN}/login?ext=${chrome.runtime.id}`;
  chrome.tabs.create({ url });
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await chrome.storage.local.remove(["baseAuth", "ytPresenceSent"]);
  refreshAuth();
});

async function refreshAuth() {
  const { baseAuth } = await chrome.storage.local.get(["baseAuth"]);
  const isOn = !!baseAuth?.token;
  document.getElementById("status").textContent = isOn ? "Conectado" : "Desconectado";
  document.getElementById("address").textContent = baseAuth?.address || "—";
}
refreshAuth();