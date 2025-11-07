// content/youtube.js
(() => {
  const state = {
    isYouTube: location.host.includes('youtube.com'),
    videoId: null,
    channelName: null,
    isPlaying: false,
    like: null,       // true/false/null
    dislike: null,    // true/false/null
    recent: []        // {type, at, extra?}
  };

  // ---- helpers ----
  const now = () => new Date().toISOString();
  const pushRecent = (r) => {
    state.recent.unshift({ at: now(), ...r });
    state.recent = state.recent.slice(0, 10);
    notifyPopup();
  };

  function getVideoIdFromUrl() {
    const u = new URL(location.href);
    return u.searchParams.get('v') || null;
  }

  function queryChannelName() {
    // <ytd-video-owner-renderer> #channel-name a  -> robusto e independente de idioma
    // presente no HTML que você anexou com "alanzoka"
    const a = document.querySelector('ytd-video-owner-renderer #channel-name a');
    return a?.textContent?.trim() || null;
  }

  function queryLikeBtn() {
    // UI nova: like-button-view-model > ... > button[aria-pressed]
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
    // costuma ser "video.html5-main-video"; caímos no <video> genérico por segurança
    return document.querySelector('video');
  }

  function notifyPopup() {
  chrome.runtime.sendMessage({ type: "UPDATE_FROM_YT", state });
}

function querySubscribed() {
  // 1. Novo design do botão de inscrição
  const btn = document.querySelector('ytd-subscribe-button-renderer tp-yt-paper-button, ytd-subscribe-button-renderer yt-button-shape button');
  if (!btn) return null;

  // 2. Caso o YouTube exponha o atributo "subscribed"
  if (btn.hasAttribute('subscribed') || btn.getAttribute('aria-pressed') === 'true') {
    return true;
  }

  // 3. Verifica o texto visível do botão
  const text = btn.textContent?.trim().toLowerCase();
  if (!text) return null;
  return /(inscrit|abonn|subscribed|登録|subscribe|inscrever|abonar|abonado)/.test(text);
}


let lastVideoId = null;
let watchStart = null;
let watchAccumulated = 0;

function getWatchSeconds() {
  if (watchStart) {
    return watchAccumulated + (Date.now() - watchStart) / 1000;
  }
  return watchAccumulated;
}

  // ---- main refresh ----
  function refreshAll() {
  const newVideoId = getVideoIdFromUrl();
  if (newVideoId !== lastVideoId) {
    lastVideoId = newVideoId;
    watchAccumulated = 0;
    watchStart = null;
  }

  state.videoId = newVideoId;
  state.channelName = queryChannelName();
  state.subscribed = querySubscribed();
  state.watchSeconds = getWatchSeconds();

  const likeBtn = queryLikeBtn();
  const dislikeBtn = queryDislikeBtn();
  state.like = readToggle(likeBtn);
  state.dislike = readToggle(dislikeBtn);
  const v = queryVideoEl();
  state.isPlaying = !!(v && !v.paused && !v.ended);
  notifyPopup();
}

  // ---- watchers ----
  function wireVideoEvents() {
  const v = queryVideoEl();
  if (!v || v._ytPresenceWired) return;
  v._ytPresenceWired = true;

  v.addEventListener('play', () => {
    if (!watchStart) watchStart = Date.now();
    state.isPlaying = true;
    notifyPopup();
  });

  v.addEventListener('pause', () => {
    if (watchStart) {
      watchAccumulated += (Date.now() - watchStart);
      watchStart = null;
    }
    state.isPlaying = false;
    notifyPopup();
  });

  v.addEventListener('ended', () => {
    if (watchStart) {
      watchAccumulated += (Date.now() - watchStart);
      watchStart = null;
    }
    state.isPlaying = false;
    notifyPopup();
  });
}

  function wireLikeDislike() {
    const likeBtn = queryLikeBtn();
    const dislikeBtn = queryDislikeBtn();

    if (likeBtn && !likeBtn._ytPresenceWired) {
      likeBtn._ytPresenceWired = true;
      likeBtn.addEventListener('click', () => {
        state.like = readToggle(likeBtn);
        if (state.like === true) pushRecent({ type: 'like' });
        if (state.like === false) pushRecent({ type: 'unlike' });
        notifyPopup();
      }, { passive: true });
    }
    if (dislikeBtn && !dislikeBtn._ytPresenceWired) {
      dislikeBtn._ytPresenceWired = true;
      dislikeBtn.addEventListener('click', () => {
        state.dislike = readToggle(dislikeBtn);
        if (state.dislike === true) pushRecent({ type: 'dislike' });
        if (state.dislike === false) pushRecent({ type: 'undislike' });
        notifyPopup();
      }, { passive: true });
    }
  }

  function wireCommentsPoC() {
    // PoC: escuta cliques no botão de enviar dentro de ytd-comments
    const root = document.querySelector('ytd-comments');
    if (!root || root._ytPresenceWired) return;
    root._ytPresenceWired = true;

    root.addEventListener('click', (ev) => {
      // botão de submit costuma ficar dentro de um ytd-button-renderer na área da caixa
      const btn = ev.target.closest('ytd-button-renderer, tp-yt-paper-button, button');
      if (!btn) return;
      // heurística: se estamos na árvore do editor/caixa de comentário, consideramos "comment"
      if (btn.closest('ytd-commentbox, ytd-comment-simplebox-renderer, #input, #composer') || btn.id === 'submit-button') {
        pushRecent({ type: 'comment' });
      }
    }, { passive: true, capture: true });
  }

  // Observa mudanças de página (YouTube SPA)
  function wireSpaNavigation() {
    const reapply = () => {
      refreshAll();
      wireVideoEvents();
      wireLikeDislike();
      wireCommentsPoC();
    };
    window.addEventListener('yt-navigate-finish', reapply);
    window.addEventListener('yt-page-data-updated', reapply);
    // fallback genérico
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.addedNodes?.length) {
          // quando aparecerem owner/like/comments, reavalia
          if ([...m.addedNodes].some(n =>
                n.querySelector?.('ytd-video-owner-renderer, like-button-view-model, dislike-button-view-model, ytd-comments'))) {
            reapply();
            break;
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // responde o popup
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'get_status') {
      // sempre atualiza antes de responder (caso popup tenha aberto enquanto algo mudava)
      refreshAll();
      sendResponse({ ok: true, state });
      return true;
    }
  });

  // boot
  refreshAll();
 
  wireVideoEvents();
  wireLikeDislike();
  wireCommentsPoC();
  wireSpaNavigation();
})();
