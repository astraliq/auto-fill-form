const AutoFillDataLoader = (function () {
  const FIO_FIELD_TYPES = new Set(['surname', 'name', 'patronimyc', 'gender']);
  const DEFAULT_LOCALE = 'ru';

  let rawTestData = null;
  let testData = null;
  let activeLocale = DEFAULT_LOCALE;
  let loadPromise = null;

  function getExtensionUrl(relativePath) {
    return chrome.runtime.getURL(relativePath);
  }

  function resolveLocaleData(data, locale) {
    if (data?.locales?.[locale]) {
      return data.locales[locale];
    }

    if (data?.locales?.[DEFAULT_LOCALE]) {
      return data.locales[DEFAULT_LOCALE];
    }

    return data;
  }

  function applyActiveLocale() {
    if (rawTestData) {
      testData = resolveLocaleData(rawTestData, activeLocale);
    }
  }

  function setActiveLocale(locale) {
    activeLocale = locale || DEFAULT_LOCALE;
    applyActiveLocale();
  }

  function loadTestData() {
    if (rawTestData) {
      return Promise.resolve(rawTestData);
    }

    if (!loadPromise) {
      loadPromise = fetch(getExtensionUrl('data/test-data.json'))
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load test data: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          rawTestData = data;
          applyActiveLocale();
          return data;
        });
    }

    return loadPromise;
  }

  function normalizeIndex(index, length) {
    if (length <= 0) {
      return 0;
    }

    return ((index % length) + length) % length;
  }

  function getPoolLength() {
    if (testData?.persons?.length) {
      return testData.persons.length;
    }

    const referencePool = testData?.surname || testData?.name || testData?.text;
    return referencePool?.length || 0;
  }

  function getRandomPoolIndex() {
    const poolLength = getPoolLength();
    if (poolLength === 0) {
      return 0;
    }

    return Math.floor(Math.random() * poolLength);
  }

  function getPersonByIndex(index) {
    if (!testData?.persons?.length) {
      return null;
    }

    const normalizedIndex = normalizeIndex(index, testData.persons.length);
    return testData.persons[normalizedIndex];
  }

  function formatPersonFioValues(person) {
    const isMale = person.gender === '1';
    const surname = activeLocale === 'en'
      ? person.surname
      : AutoFillSurnameFormatter.formatForGender(person.surname, isMale);

    return {
      surname,
      name: person.name,
      patronimyc: person.patronimyc,
      gender: person.gender,
    };
  }

  function getValueByIndex(fieldType, index) {
    const person = getPersonByIndex(index);
    if (person && FIO_FIELD_TYPES.has(fieldType)) {
      const personValues = formatPersonFioValues(person);
      if (personValues[fieldType] !== undefined) {
        return personValues[fieldType];
      }
    }

    if (!testData || !testData[fieldType] || testData[fieldType].length === 0) {
      return getRandomValue(fieldType);
    }

    const pool = testData[fieldType];
    return pool[normalizeIndex(index, pool.length)];
  }

  function getRandomValue(fieldType) {
    if (!testData || !testData[fieldType] || testData[fieldType].length === 0) {
      if (testData?.text?.length) {
        return testData.text[Math.floor(Math.random() * testData.text.length)];
      }
      return `test-${Date.now()}`;
    }

    const pool = testData[fieldType];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function getPersonFioValues(index) {
    const person = getPersonByIndex(index);
    if (!person) {
      return null;
    }

    return formatPersonFioValues(person);
  }

  return {
    loadTestData,
    setActiveLocale,
    getActiveLocale: () => activeLocale,
    getRandomValue,
    getRandomPoolIndex,
    getValueByIndex,
    getPersonByIndex,
    getPersonFioValues,
  };
})();
