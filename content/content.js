const AutoFillContent = (function () {
  let lastContextTarget = null;
  let isInitialized = false;

  function showToast(message) {
    const existingToast = document.getElementById('auto-fill-form-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'auto-fill-form-toast';
    toast.textContent = message;
    toast.style.cssText = [
      'position: fixed',
      'top: 16px',
      'right: 16px',
      'z-index: 2147483647',
      'background: #2563eb',
      'color: #fff',
      'padding: 10px 14px',
      'border-radius: 8px',
      'font: 14px/1.4 Arial, sans-serif',
      'box-shadow: 0 4px 16px rgba(0,0,0,0.2)',
      'max-width: 360px',
    ].join(';');

    document.documentElement.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 2500);
  }

  function handleFillForm() {
    return Promise.all([
      AutoFillDataLoader.loadTestData(),
      AutoFillSettings.loadSettings(),
    ]).then(() => {
      AutoFillDataLoader.setActiveLocale(AutoFillSettings.resolveFillLanguage());
      const root = AutoFillFieldDetector.getFormRoot(lastContextTarget || document.activeElement);
      const elements = AutoFillFieldDetector.collectFormFields(root);
      const fields = elements.map((element) => ({ element }));
      const filledCount = AutoFillFieldFiller.fillFields(fields);

      showToast(`Auto Fill Form: заполнено полей — ${filledCount}`);
    }).catch((error) => {
      showToast(`Auto Fill Form: ошибка — ${error.message}`);
    });
  }

  function handleFillField() {
    return Promise.all([
      AutoFillDataLoader.loadTestData(),
      AutoFillSettings.loadSettings(),
    ]).then(() => {
      AutoFillDataLoader.setActiveLocale(AutoFillSettings.resolveFillLanguage());
      const targetElement = AutoFillFieldDetector.resolveTargetElement(
        lastContextTarget,
        document.activeElement
      );

      if (!targetElement) {
        showToast('Auto Fill Form: не найдено поле для заполнения');
        return;
      }

      if (AutoFillSettings.isExcludedElement(targetElement)) {
        showToast('Auto Fill Form: поле исключено настройками');
        return;
      }

      const result = AutoFillFieldFiller.fillSingleElement(targetElement);
      if (!result.filled) {
        showToast('Auto Fill Form: не удалось определить тип поля');
        return;
      }

      if (result.filledCount > 1) {
        showToast(`Auto Fill Form: заполнено связанных полей ФИО — ${result.filledCount}`);
        return;
      }

      showToast(`Auto Fill Form: заполнено поле (${result.fieldType})`);
    }).catch((error) => {
      showToast(`Auto Fill Form: ошибка — ${error.message}`);
    });
  }

  function onContextMenu(event) {
    lastContextTarget = event.target;
  }

  function onMessage(message, sender, sendResponse) {
    if (!message?.action) {
      return false;
    }

    if (message.action === 'fillForm') {
      handleFillForm().then(() => sendResponse({ success: true }));
      return true;
    }

    if (message.action === 'fillField') {
      handleFillField().then(() => sendResponse({ success: true }));
      return true;
    }

    return false;
  }

  function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;
    document.addEventListener('contextmenu', onContextMenu, true);
    chrome.runtime.onMessage.addListener(onMessage);
  }

  init();

  return {
    init,
    handleFillForm,
    handleFillField,
  };
})();
