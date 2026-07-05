const AutoFillFieldDetector = (function () {
  const SKIP_ATTR_NAMES = new Set([
    'id_client',
    'id_md_member',
    'id_place',
    'online_id_online',
    'is_disabled',
    'is_payer',
    'place_cost',
    'target_place_id',
    'custom_pay_cost',
    'formula_pay',
  ]);

  const MINI_SELECTOR_MAP = {
    min_surname: 'surname',
    min_name: 'name',
    min_patronimyc: 'patronimyc',
    min_gender: 'gender',
    min_email: 'email',
    min_birth: 'birth',
    min_passport: 'passport',
    min_passport_from: 'passport_from',
    min_passport_register: 'passport_register',
    min_grazhdanstvo: 'grazhdanstvo',
    min_tourist_type: 'tourist_type',
    min_birth_certificate: 'birth_certificate',
    min_place_cost: 'number',
    min_promotion_id: 'select_dynamic',
    min_promotion_admin_id: 'select_dynamic',
  };

  const KNOWN_FIELD_TYPES = new Set([
    'surname',
    'name',
    'patronimyc',
    'gender',
    'email',
    'phone',
    'birth',
    'passport',
    'passport_from',
    'passport_register',
    'grazhdanstvo',
    'tourist_type',
    'birth_certificate',
    'adress',
    'number',
    'text',
    'select_dynamic',
  ]);

  function normalizeString(value) {
    return (value || '').toString().toLowerCase().trim();
  }

  function getLabelText(element) {
    const elementId = element.id;
    if (elementId) {
      const label = document.querySelector(`label[for="${CSS.escape(elementId)}"]`);
      if (label) {
        return label.textContent;
      }
    }

    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent;
    }

    const formGroup = element.closest('.form-group, .field-');
    if (formGroup) {
      const groupLabel = formGroup.querySelector('label');
      if (groupLabel) {
        return groupLabel.textContent;
      }
    }

    return '';
  }

  function getHaystack(element) {
    return normalizeString([
      element.getAttribute('data-attr_name'),
      element.getAttribute('data-mini_selector'),
      element.name,
      element.id,
      element.type,
      element.placeholder,
      element.getAttribute('aria-label'),
      element.getAttribute('autocomplete'),
      element.className,
      getLabelText(element),
    ].join(' '));
  }

  function detectFromAttrName(attrName) {
    if (!attrName || SKIP_ATTR_NAMES.has(attrName)) {
      return null;
    }

    if (KNOWN_FIELD_TYPES.has(attrName)) {
      return attrName;
    }

    if (attrName === 'tels' || attrName === 'tel') {
      return 'phone';
    }

    if (attrName === 'adress' || attrName === 'address') {
      return 'adress';
    }

    if (attrName === 'promotion_id' || attrName === 'promotion_admin_id') {
      return 'select_dynamic';
    }

    if (attrName.includes('cost') || attrName.includes('discount') || attrName === 'to_pay' || attrName === 'agent_profit') {
      return 'number';
    }

    return null;
  }

  function detectFromMiniSelector(miniSelector) {
    if (!miniSelector) {
      return null;
    }
    return MINI_SELECTOR_MAP[miniSelector] || null;
  }

  function haystackHasBracketField(haystack, fieldName) {
    return haystack.includes(`[${fieldName.toLowerCase()}]`);
  }

  function detectFromHaystack(haystack, element) {
    if (element.classList.contains('passport')) {
      return 'passport';
    }
    if (element.classList.contains('birth_certificate')) {
      return 'birth_certificate';
    }
    if (element.classList.contains('mp-datepicker-no-time')) {
      return 'birth';
    }
    if (element.classList.contains('select2_input') || haystack.includes('tels') || haystack.includes('phone') || haystack.includes('телефон')) {
      return 'phone';
    }

    if (haystackHasBracketField(haystack, 'surname') || haystack.includes('lastname') || haystack.includes('last_name') || haystack.includes('фамилия')) {
      return 'surname';
    }

    if (haystackHasBracketField(haystack, 'patronimyc') || haystack.includes('patronymic') || haystack.includes('middle_name') || haystack.includes('отчество')) {
      return 'patronimyc';
    }

    if (
      haystackHasBracketField(haystack, 'name')
      || haystack.includes('firstname')
      || haystack.includes('first_name')
      || haystack.includes('имя')
      || /(?:^|[\[\-])name(?:[\]\-_]|$)/.test(haystack)
    ) {
      if (!haystack.includes('surname') && !haystack.includes('username') && !haystack.includes('patronimyc')) {
        return 'name';
      }
    }

    const rules = [
      { type: 'email', patterns: ['email', 'e-mail', 'почта', 'mail'] },
      { type: 'phone', patterns: ['tel', 'phone', 'телефон', 'mobile', 'мобильн'] },
      { type: 'birth', patterns: ['birth', 'birthdate', 'дата рождения', 'др', 'birthday'] },
      { type: 'passport', patterns: ['passport', 'паспорт'] },
      { type: 'passport_from', patterns: ['passport_from', 'кем выдан', 'выдан'] },
      { type: 'passport_register', patterns: ['passport_register', 'регистрац', 'прописк'] },
      { type: 'birth_certificate', patterns: ['birth_certificate', 'свидетельство'] },
      { type: 'gender', patterns: ['gender', 'пол'] },
      { type: 'grazhdanstvo', patterns: ['grazhdanstvo', 'citizenship', 'гражданство', 'country'] },
      { type: 'tourist_type', patterns: ['tourist_type', 'place_type', 'тип места'] },
      { type: 'adress', patterns: ['adress', 'address', 'адрес'] },
      { type: 'number', patterns: ['to_pay', 'agent_discount', 'agent_profit', 'cost', 'сумма', 'стоимость'] },
    ];

    for (const rule of rules) {
      if (rule.patterns.some((pattern) => haystack.includes(pattern))) {
        return rule.type;
      }
    }

    if (element.type === 'email') {
      return 'email';
    }
    if (element.type === 'tel') {
      return 'phone';
    }
    if (element.type === 'number') {
      return 'number';
    }
    if (element.type === 'date') {
      return 'birth';
    }

    return null;
  }

  function isFillableElement(element) {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    const tagName = element.tagName;
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
      return false;
    }

    if (element.closest('.d-none, [style*="display: none"], [style*="display:none"]')) {
      const isVisible = element.offsetParent !== null || element.getClientRects().length > 0;
      if (!isVisible) {
        return false;
      }
    }

    if (typeof AutoFillSettings !== 'undefined') {
      if (AutoFillSettings.shouldSkipDisabled() && AutoFillSettings.isDisabledElement(element)) {
        return false;
      }

      if (AutoFillSettings.shouldSkipReadonly() && AutoFillSettings.isReadonlyElement(element)) {
        return false;
      }
    } else {
      if (element.disabled || element.readOnly) {
        return false;
      }
    }

    if (tagName === 'INPUT') {
      const inputType = (element.type || 'text').toLowerCase();
      if (['hidden', 'checkbox', 'radio', 'file', 'submit', 'button', 'reset', 'image'].includes(inputType)) {
        return false;
      }
      if (element.id === 'places-payment-url-input') {
        return false;
      }
    }

    const attrName = element.getAttribute('data-attr_name');
    if (attrName && SKIP_ATTR_NAMES.has(attrName)) {
      return false;
    }

    if (typeof AutoFillSettings !== 'undefined' && AutoFillSettings.isExcludedElement(element)) {
      return false;
    }

    return true;
  }

  function detectFieldType(element) {
    if (!isFillableElement(element)) {
      return null;
    }

    const attrName = element.getAttribute('data-attr_name');
    const fromAttr = detectFromAttrName(attrName);
    if (fromAttr) {
      return fromAttr;
    }

    const miniSelector = element.getAttribute('data-mini_selector');
    const fromMini = detectFromMiniSelector(miniSelector);
    if (fromMini) {
      return fromMini;
    }

    const haystack = getHaystack(element);
    const fromHaystack = detectFromHaystack(haystack, element);
    if (fromHaystack) {
      return fromHaystack;
    }

    if (element.tagName === 'SELECT') {
      return 'select_dynamic';
    }

    if (element.tagName === 'TEXTAREA') {
      return 'text';
    }

    return 'text';
  }

  function getFormRoot(element) {
    if (!element) {
      return document;
    }

    const form = element.closest('form');
    return form || document;
  }

  function collectFormFields(rootElement) {
    const root = rootElement || document;
    const selector = 'input, textarea, select';
    const elements = Array.from(root.querySelectorAll(selector));

    return elements.filter((element) => {
      if (!isFillableElement(element)) {
        return false;
      }
      return detectFieldType(element) !== null;
    });
  }

  function resolveTargetElement(lastContextTarget, activeElement) {
    const candidates = [lastContextTarget, activeElement, document.activeElement];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      if (candidate.tagName === 'INPUT' || candidate.tagName === 'TEXTAREA' || candidate.tagName === 'SELECT') {
        return candidate;
      }

      const select2Container = candidate.closest?.('.select2-container');
      if (select2Container) {
        const selectElement = select2Container.previousElementSibling;
        if (selectElement?.tagName === 'SELECT' && isFillableElement(selectElement)) {
          return selectElement;
        }
        const nestedSelect = select2Container.parentElement?.querySelector('select');
        if (nestedSelect && isFillableElement(nestedSelect)) {
          return nestedSelect;
        }
      }

      const nested = candidate.querySelector?.('input, textarea, select');
      if (nested && isFillableElement(nested)) {
        return nested;
      }
    }

    return null;
  }

  return {
    detectFieldType,
    isFillableElement,
    getFormRoot,
    collectFormFields,
    resolveTargetElement,
  };
})();
