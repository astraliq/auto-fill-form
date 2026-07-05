const AutoFillFioGrouper = (function () {
  const FIO_NAME_FIELD_TYPES = new Set(['surname', 'name', 'patronimyc']);
  const GENDER_FIELD_TYPE = 'gender';
  const FIO_FIELD_TYPES = new Set([...FIO_NAME_FIELD_TYPES, GENDER_FIELD_TYPE]);

  const FIO_FILL_ORDER = ['gender', 'surname', 'name', 'patronimyc'];
  const FIO_NAME_FILL_ORDER = ['surname', 'name', 'patronimyc'];

  const FIELD_SUFFIX_PATTERN = /\[(surname|name|patronimyc|gender|birth|passport|passport_from|passport_register|grazhdanstvo|email|tourist_type|birth_certificate|tels|tel|adress|address|cost|to_pay|agent_profit|agent_discount|promotion_id|promotion_admin_id|place_cost|is_tourist|id_client|id_md_member)\]$/i;

  const PROXIMITY_SELECTORS = [
    '.entity-card-content',
    '.panel-body.entity-card-content',
    '.multiple_input-row',
    '.entity-card',
    '#client-form',
    '.client_form_block',
    '.tourist_block',
  ];

  function isFioFieldType(fieldType) {
    return FIO_FIELD_TYPES.has(fieldType);
  }

  function isFioNameFieldType(fieldType) {
    return FIO_NAME_FIELD_TYPES.has(fieldType);
  }

  function isGenderFieldType(fieldType) {
    return fieldType === GENDER_FIELD_TYPE;
  }

  function groupHasFioNameFields(fieldsWithMeta, groupKey) {
    return fieldsWithMeta.some(
      (field) => field.groupKey === groupKey && isFioNameFieldType(field.fieldType)
    );
  }

  function getGroupFioFields(fieldsWithMeta, groupKey) {
    return fieldsWithMeta.filter((field) => field.groupKey === groupKey && isFioFieldType(field.fieldType));
  }

  function normalizeGroupKey(element) {
    const fieldName = (element.name || '').toLowerCase();
    const elementId = (element.id || '').toLowerCase();

    const touristNameMatch = fieldName.match(/^mdbookingmodel\[tourists\]\[(\d+)\]/);
    if (touristNameMatch) {
      return `tourist:${touristNameMatch[1]}`;
    }

    if (fieldName.startsWith('clients[')) {
      return 'clients';
    }

    const touristIdMatch = elementId.match(/^mdbookingmodel-tourists-(\d+)-/);
    if (touristIdMatch) {
      return `tourist:${touristIdMatch[1]}`;
    }

    if (elementId.startsWith('clients-')) {
      return 'clients';
    }

    if (FIELD_SUFFIX_PATTERN.test(fieldName)) {
      const prefix = fieldName.replace(FIELD_SUFFIX_PATTERN, '');
      if (prefix) {
        return `name:${prefix}`;
      }
    }

    const bracketIndexMatch = fieldName.match(/^(.+\[\d+\])\[[^\]]+\]$/);
    if (bracketIndexMatch) {
      return `name:${bracketIndexMatch[1]}`;
    }

    const container = getProximityContainer(element);
    if (container) {
      const entityCard = container.closest('.entity-card') || (container.classList.contains('entity-card') ? container : null);
      if (entityCard) {
        const cardIndex = entityCard.getAttribute('data-index');
        if (cardIndex !== null && cardIndex !== '') {
          return `dom:card:${cardIndex}`;
        }
      }

      if (container.id) {
        return `dom:id:${container.id.toLowerCase()}`;
      }

      return `dom:node:${getElementIdentity(container)}`;
    }

    return null;
  }

  function getProximityContainer(element) {
    for (const selector of PROXIMITY_SELECTORS) {
      const container = element.closest(selector);
      if (container) {
        return container;
      }
    }

    const row = element.closest('.row');
    if (row) {
      const hasFioField = row.querySelector('[data-attr_name="surname"], [data-attr_name="name"], [data-attr_name="patronimyc"], [data-attr_name="gender"]');
      if (hasFioField) {
        return row;
      }
    }

    return null;
  }

  function getElementIdentity(element) {
    const parts = [];
    let current = element;

    while (current && current !== document.body && parts.length < 4) {
      const tag = current.tagName.toLowerCase();
      const idPart = current.id ? `#${current.id}` : '';
      const classPart = typeof current.className === 'string' && current.className
        ? `.${current.className.trim().split(/\s+/).slice(0, 2).join('.')}`
        : '';
      parts.unshift(`${tag}${idPart}${classPart}`);
      current = current.parentElement;
    }

    return parts.join('>');
  }

  function getFieldGroupKey(element) {
    return normalizeGroupKey(element);
  }

  function collectFieldsInSameGroup(targetElement, allElements) {
    const groupKey = normalizeGroupKey(targetElement);
    if (!groupKey) {
      return [targetElement];
    }

    const sameGroupElements = allElements.filter((element) => normalizeGroupKey(element) === groupKey);
    if (sameGroupElements.length > 0) {
      return sameGroupElements;
    }

    const container = getProximityContainer(targetElement);
    if (!container) {
      return [targetElement];
    }

    return allElements.filter((element) => getProximityContainer(element) === container);
  }

  function buildGroupIndexMap(fields) {
    const groupKeys = new Set();
    const fieldsWithMeta = [];

    for (const field of fields) {
      const fieldType = AutoFillFieldDetector.detectFieldType(field.element);
      if (!fieldType) {
        continue;
      }

      const groupKey = normalizeGroupKey(field.element)
        || `solo:${getElementIdentity(getProximityContainer(field.element) || field.element)}`;

      fieldsWithMeta.push({
        element: field.element,
        fieldType,
        groupKey,
      });

      if (isFioNameFieldType(fieldType) || isGenderFieldType(fieldType)) {
        groupKeys.add(groupKey);
      }
    }

    const groupIndexMap = new Map();
    for (const groupKey of groupKeys) {
      if (groupHasFioNameFields(fieldsWithMeta, groupKey)) {
        groupIndexMap.set(groupKey, AutoFillDataLoader.getRandomPoolIndex());
      }
    }

    return { fieldsWithMeta, groupIndexMap };
  }

  function resolveFieldValue(fieldType, groupKey, groupIndexMap) {
    if (isFioFieldType(fieldType) && groupKey && groupIndexMap.has(groupKey)) {
      return AutoFillDataLoader.getValueByIndex(fieldType, groupIndexMap.get(groupKey));
    }

    return AutoFillDataLoader.getRandomValue(fieldType);
  }

  function getRelatedFioFields(targetElement, rootElement) {
    const root = rootElement || document;
    const allElements = AutoFillFieldDetector.collectFormFields(root);
    const groupElements = collectFieldsInSameGroup(targetElement, allElements);

    const relatedFields = groupElements
      .map((element) => ({
        element,
        fieldType: AutoFillFieldDetector.detectFieldType(element),
      }))
      .filter((field) => field.fieldType && (isFioNameFieldType(field.fieldType) || isGenderFieldType(field.fieldType)));

    const hasFioNameField = relatedFields.some((field) => isFioNameFieldType(field.fieldType));
    if (!hasFioNameField) {
      return sortFioFields(relatedFields.filter((field) => isGenderFieldType(field.fieldType)));
    }

    return sortFioFields(relatedFields);
  }

  function sortFioFields(fields) {
    return [...fields].sort((leftField, rightField) => {
      const leftOrder = FIO_FILL_ORDER.indexOf(leftField.fieldType);
      const rightOrder = FIO_FILL_ORDER.indexOf(rightField.fieldType);
      return leftOrder - rightOrder;
    });
  }

  return {
    isFioFieldType,
    isFioNameFieldType,
    isGenderFieldType,
    getFieldGroupKey,
    buildGroupIndexMap,
    resolveFieldValue,
    getRelatedFioFields,
    collectFieldsInSameGroup,
    sortFioFields,
    getGroupFioFields,
    groupHasFioNameFields,
    FIO_NAME_FILL_ORDER,
  };
})();
