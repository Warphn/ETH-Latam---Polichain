// popup.js
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "UPDATE_FROM_YT") {
    const s = msg.state;
    updateUI(s);
  }
});

function formatTime(s) {
  s = Math.floor(s || 0);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function updateUI(s) {
  set('is-yt', s.isYouTube ? '<span class="ok">Sim</span>' : '<span class="bad">Não</span>');
  set('channel', s.channelName || '(desconhecido)');
  set('vid', s.videoId || '—');
  set('watch-time', formatTime(s.watchSeconds));
  set('playing', s.isPlaying ? '<span class="ok">Sim</span>' : '<span class="bad">Não</span>');
  set('subscribed', s.subscribed === true ? '<span class="ok">Sim</span>' :
    s.subscribed === false ? '<span class="bad">Não</span>' : '—'); 
  let ld = '—';
  if (s.like === true) ld = 'Like';
  else if (s.dislike === true) ld = 'Dislike';
  else if (s.like === false || s.dislike === false) ld = 'Nenhum';
  set('ld', ld);

  const ul = document.getElementById('recent');
  ul.innerHTML = '';
  s.recent.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${new Date(r.at).toLocaleTimeString()} — ${r.type}`;
    ul.appendChild(li);
  });
}

function set(id, html) { document.getElementById(id).innerHTML = html; }

(async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: 'get_status' }, (resp) => {
    if (!resp?.ok) {
      set('is-yt', '<span class="bad">Não</span>');
      return;
    }
    const s = resp.state;
    set('is-yt', s.isYouTube ? '<span class="ok">Sim</span>' : '<span class="bad">Não</span>');
    set('channel', s.channelName || '(desconhecido)');
    set('vid', s.videoId || '—');
    set('playing', s.isPlaying ? '<span class="ok">Sim</span>' : '<span class="bad">Não</span>');
    let ld = '—';
    if (s.like === true) ld = 'Like';
    else if (s.dislike === true) ld = 'Dislike';
    else if (s.like === false || s.dislike === false) ld = 'Nenhum';
    set('ld', ld);

    const ul = document.getElementById('recent');
    ul.innerHTML = '';
    s.recent.forEach(r => {
      const li = document.createElement('li');
      li.textContent = `${new Date(r.at).toLocaleTimeString()} — ${r.type}`;
      ul.appendChild(li);
    });
  });
})();
