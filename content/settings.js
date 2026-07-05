const AutoFillSettings = (function () {
  const STORAGE_KEYS = {
    excludeWords: 'excludeWords',
    skipReadonly: 'skipReadonly',
    skipDisabled: 'skipDisabled',
    fieldPreferences: 'fieldPreferences',
    fillLanguage: 'fillLanguage',
  };

  const FILL_LANGUAGES = {
    ru: 'ru',
    en: 'en',
    random: 'random',
  };

  const DEFAULT_SETTINGS = {
    [STORAGE_KEYS.excludeWords]: '',
    [STORAGE_KEYS.skipReadonly]: true,
    [STORAGE_KEYS.skipDisabled]: true,
    [STORAGE_KEYS.fieldPreferences]: '',
    [STORAGE_KEYS.fillLanguage]: FILL_LANGUAGES.ru,
  };

  let excludeWords = [];
  let fieldPreferences = [];
  let skipReadonly = DEFAULT_SETTINGS[STORAGE_KEYS.skipReadonly];
  let skipDisabled = DEFAULT_SETTINGS[STORAGE_KEYS.skipDisabled];
  let fillLanguage = DEFAULT_SETTINGS[STORAGE_KEYS.fillLanguage];
  let loadPromise = null;

  function parseExcludeWords(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
      return [];
    }

    return rawValue
      .split(',')
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0);
  }

  function parseFieldPreferences(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
      return [];
    }

    const rules = [];

    for (const line of rawValue.split('\n')) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }

      const pattern = trimmedLine.slice(0, separatorIndex).trim().toLowerCase();
      const valuesPart = trimmedLine.slice(separatorIndex + 1).trim();
      if (!pattern || !valuesPart) {
        continue;
      }

      const values = valuesPart
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (values.length === 0) {
        continue;
      }

      rules.push({ pattern, values });
    }

    return rules;
  }

  function applySettings(result) {
    excludeWords = parseExcludeWords(result[STORAGE_KEYS.excludeWords]);
    fieldPreferences = parseFieldPreferences(result[STORAGE_KEYS.fieldPreferences]);
    skipReadonly = result[STORAGE_KEYS.skipReadonly] !== false;
    skipDisabled = result[STORAGE_KEYS.skipDisabled] !== false;
    fillLanguage = normalizeFillLanguage(result[STORAGE_KEYS.fillLanguage]);
  }

  function normalizeFillLanguage(value) {
    if (value === FILL_LANGUAGES.en || value === FILL_LANGUAGES.random) {
      return value;
    }

    return FILL_LANGUAGES.ru;
  }

  function resolveFillLanguage() {
    if (fillLanguage === FILL_LANGUAGES.random) {
      return Math.random() < 0.5 ? FILL_LANGUAGES.ru : FILL_LANGUAGES.en;
    }

    return fillLanguage;
  }

  function loadSettings() {
    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
        applySettings(result);
        resolve(getSettingsSnapshot());
      });
    });

    return loadPromise;
  }

  function getSettingsSnapshot() {
    return {
      excludeWords: [...excludeWords],
      fieldPreferences: fieldPreferences.map((rule) => ({ ...rule, values: [...rule.values] })),
      fillLanguage,
      skipReadonly,
      skipDisabled,
    };
  }

  function setExcludeWords(rawValue) {
    excludeWords = parseExcludeWords(rawValue);

    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEYS.excludeWords]: rawValue.trim() }, () => {
        resolve(getSettingsSnapshot());
      });
    });
  }

  function getExcludeWords() {
    return [...excludeWords];
  }

  function shouldSkipReadonly() {
    return skipReadonly;
  }

  function shouldSkipDisabled() {
    return skipDisabled;
  }

  function elementMatchesPattern(element, pattern) {
    const elementName = (element.name || '').toLowerCase();
    const elementId = (element.id || '').toLowerCase();

    if (elementName && elementName.includes(pattern)) {
      return true;
    }

    if (elementId && elementId.includes(pattern)) {
      return true;
    }

    return false;
  }

  function getPreferredValue(element) {
    if (!element || fieldPreferences.length === 0) {
      return null;
    }

    for (const rule of fieldPreferences) {
      if (elementMatchesPattern(element, rule.pattern)) {
        const randomIndex = Math.floor(Math.random() * rule.values.length);
        return rule.values[randomIndex];
      }
    }

    return null;
  }

  function getFieldPreferences() {
    return fieldPreferences.map((rule) => ({ ...rule, values: [...rule.values] }));
  }

  function isExcludedElement(element) {
    if (!element || excludeWords.length === 0) {
      return false;
    }

    const elementName = (element.name || '').toLowerCase();
    const elementId = (element.id || '').toLowerCase();

    if (!elementName && !elementId) {
      return false;
    }

    return excludeWords.some((word) => {
      if (elementName && elementName.includes(word)) {
        return true;
      }
      if (elementId && elementId.includes(word)) {
        return true;
      }
      return false;
    });
  }

  function isReadonlyElement(element) {
    if (!element) {
      return false;
    }

    if (element.readOnly) {
      return true;
    }

    return element.hasAttribute('readonly');
  }

  function isDisabledElement(element) {
    if (!element) {
      return false;
    }

    return element.disabled || element.hasAttribute('disabled');
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
      return;
    }

    const storageKeys = Object.values(STORAGE_KEYS);
    const hasRelevantChange = storageKeys.some((key) => changes[key]);
    if (!hasRelevantChange) {
      return;
    }

    if (changes[STORAGE_KEYS.excludeWords]) {
      excludeWords = parseExcludeWords(changes[STORAGE_KEYS.excludeWords].newValue);
    }

    if (changes[STORAGE_KEYS.fieldPreferences]) {
      fieldPreferences = parseFieldPreferences(changes[STORAGE_KEYS.fieldPreferences].newValue);
    }

    if (changes[STORAGE_KEYS.fillLanguage]) {
      fillLanguage = normalizeFillLanguage(changes[STORAGE_KEYS.fillLanguage].newValue);
    }

    if (changes[STORAGE_KEYS.skipReadonly]) {
      skipReadonly = changes[STORAGE_KEYS.skipReadonly].newValue !== false;
    }

    if (changes[STORAGE_KEYS.skipDisabled]) {
      skipDisabled = changes[STORAGE_KEYS.skipDisabled].newValue !== false;
    }

    loadPromise = Promise.resolve(getSettingsSnapshot());
  });

  return {
    loadSettings,
    setExcludeWords,
    getExcludeWords,
    getFieldPreferences,
    getPreferredValue,
    resolveFillLanguage,
    getFillLanguage: () => fillLanguage,
    shouldSkipReadonly,
    shouldSkipDisabled,
    isExcludedElement,
    isReadonlyElement,
    isDisabledElement,
    parseExcludeWords,
    parseFieldPreferences,
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    FILL_LANGUAGES,
  };
})();
