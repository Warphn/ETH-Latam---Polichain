// sw.js
const tabStates = new Map(); // tabId -> { state, interactions: [] }

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "YTD_STATE" && sender.tab?.id != null) {
    const existing = tabStates.get(sender.tab.id) || { interactions: [] };
    tabStates.set(sender.tab.id, { ...existing, state: msg.state });
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === "YTD_INTERACTION" && sender.tab?.id != null) {
    const existing = tabStates.get(sender.tab.id) || { interactions: [] };
    existing.interactions.unshift({
      kind: msg.kind, // 'like', 'dislike', 'unlike', 'undislike', 'comment_submitted'
      at: Date.now()
    });
    // mantém só as últimas 20
    existing.interactions = existing.interactions.slice(0, 20);
    tabStates.set(sender.tab.id, existing);
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === "GET_STATE_FOR_TAB") {
    const data = tabStates.get(msg.tabId) || null;
    sendResponse({ ok: true, data });
    return true;
  }
});

chrome.tabs.onRemoved.addListener(tabId => tabStates.delete(tabId));
