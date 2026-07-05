const excludeWordsInput = document.getElementById('excludeWords');
const fieldPreferencesInput = document.getElementById('fieldPreferences');
const skipReadonlyInput = document.getElementById('skipReadonly');
const skipDisabledInput = document.getElementById('skipDisabled');
const fillLanguageInputs = document.querySelectorAll('input[name="fillLanguage"]');
const saveButton = document.getElementById('save');
const statusElement = document.getElementById('status');

const STORAGE_KEYS = {
  excludeWords: 'excludeWords',
  fieldPreferences: 'fieldPreferences',
  skipReadonly: 'skipReadonly',
  skipDisabled: 'skipDisabled',
  fillLanguage: 'fillLanguage',
};

const DEFAULT_SETTINGS = {
  [STORAGE_KEYS.excludeWords]: '',
  [STORAGE_KEYS.fieldPreferences]: '',
  [STORAGE_KEYS.skipReadonly]: true,
  [STORAGE_KEYS.skipDisabled]: true,
  [STORAGE_KEYS.fillLanguage]: 'ru',
};

function getSelectedFillLanguage() {
  const checkedInput = document.querySelector('input[name="fillLanguage"]:checked');
  return checkedInput ? checkedInput.value : DEFAULT_SETTINGS[STORAGE_KEYS.fillLanguage];
}

function setSelectedFillLanguage(value) {
  const normalizedValue = value === 'en' || value === 'random' ? value : 'ru';

  fillLanguageInputs.forEach((input) => {
    input.checked = input.value === normalizedValue;
  });
}

function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.color = isError ? '#dc2626' : '#059669';
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
    excludeWordsInput.value = result[STORAGE_KEYS.excludeWords];
    fieldPreferencesInput.value = result[STORAGE_KEYS.fieldPreferences];
    skipReadonlyInput.checked = result[STORAGE_KEYS.skipReadonly] !== false;
    skipDisabledInput.checked = result[STORAGE_KEYS.skipDisabled] !== false;
    setSelectedFillLanguage(result[STORAGE_KEYS.fillLanguage]);
  });
}

function saveSettings() {
  const settings = {
    [STORAGE_KEYS.excludeWords]: excludeWordsInput.value.trim(),
    [STORAGE_KEYS.fieldPreferences]: fieldPreferencesInput.value.trim(),
    [STORAGE_KEYS.skipReadonly]: skipReadonlyInput.checked,
    [STORAGE_KEYS.skipDisabled]: skipDisabledInput.checked,
    [STORAGE_KEYS.fillLanguage]: getSelectedFillLanguage(),
  };

  chrome.storage.sync.set(settings, () => {
    if (chrome.runtime.lastError) {
      showStatus('Ошибка сохранения', true);
      return;
    }

    showStatus('Сохранено');
    window.setTimeout(() => {
      statusElement.textContent = '';
    }, 2000);
  });
}

saveButton.addEventListener('click', saveSettings);
loadSettings();
