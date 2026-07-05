const MENU_FILL_FORM = 'fill-entire-form';
const MENU_FILL_FIELD = 'fill-current-field';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_FILL_FORM,
      title: 'Заполнить всю форму',
      contexts: ['page', 'editable', 'frame'],
    });

    chrome.contextMenus.create({
      id: MENU_FILL_FIELD,
      title: 'Заполнить текущее поле',
      contexts: ['editable'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) {
    return;
  }

  let action = null;
  if (info.menuItemId === MENU_FILL_FORM) {
    action = 'fillForm';
  } else if (info.menuItemId === MENU_FILL_FIELD) {
    action = 'fillField';
  }

  if (!action) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action }, () => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: [
          'content/settings.js',
          'content/surname-formatter.js',
          'content/data-loader.js',
          'content/fio-grouper.js',
          'content/field-detector.js',
          'content/field-filler.js',
          'content/content.js',
        ],
      }).then(() => {
        chrome.tabs.sendMessage(tab.id, { action });
      });
    }
  });
});
