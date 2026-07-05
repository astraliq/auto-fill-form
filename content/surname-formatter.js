const AutoFillSurnameFormatter = (function () {
  function splitNumericSuffix(value) {
    const match = value.match(/^(.+?)(\d+)$/u);
    if (!match) {
      return { base: value, suffix: '' };
    }

    return { base: match[1], suffix: match[2] };
  }

  function declineSurnameToFemale(surname) {
    const { base, suffix } = splitNumericSuffix(surname);

    if (/(?:ская|цкая|ова|ева|ёва|ина|ына)$/iu.test(base)) {
      return surname;
    }

    const rules = [
      [/ский$/iu, 'ская'],
      [/цкий$/iu, 'цкая'],
      [/ёв$/iu, 'ёва'],
      [/ов$/iu, 'ова'],
      [/ев$/iu, 'ева'],
      [/ин$/iu, 'ина'],
      [/ын$/iu, 'ына'],
      [/ой$/iu, 'ая'],
      [/ий$/iu, 'ая'],
    ];

    for (const [pattern, replacement] of rules) {
      if (pattern.test(base)) {
        return `${base.replace(pattern, replacement)}${suffix}`;
      }
    }

    return surname;
  }

  function toMasculineSurname(surname) {
    const { base, suffix } = splitNumericSuffix(surname);

    const rules = [
      [/ская$/iu, 'ский'],
      [/цкая$/iu, 'цкий'],
      [/ёва$/iu, 'ёв'],
      [/ова$/iu, 'ов'],
      [/ева$/iu, 'ев'],
      [/ина$/iu, 'ин'],
      [/ына$/iu, 'ын'],
      [/ая$/iu, 'ий'],
    ];

    for (const [pattern, replacement] of rules) {
      if (pattern.test(base)) {
        return `${base.replace(pattern, replacement)}${suffix}`;
      }
    }

    return surname;
  }

  function formatForGender(surname, isMale) {
    if (!surname) {
      return surname;
    }

    if (isMale) {
      return toMasculineSurname(surname);
    }

    return declineSurnameToFemale(surname);
  }

  return {
    formatForGender,
    declineSurnameToFemale,
    toMasculineSurname,
  };
})();
