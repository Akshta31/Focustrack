// Content script - minimal, just sends page metadata to background
(function() {
  // Send title updates to background on single-page app navigation
  let lastUrl = location.href;
  let lastTitle = document.title;

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl || document.title !== lastTitle) {
      lastUrl = location.href;
      lastTitle = document.title;
      chrome.runtime.sendMessage({
        type: 'PAGE_UPDATED',
        url: lastUrl,
        title: lastTitle
      }).catch(() => {}); // ignore if background not ready
    }
  });

  observer.observe(document, { subtree: true, childList: true });
})();
