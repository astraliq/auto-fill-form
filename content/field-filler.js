const AutoFillFieldFiller = (function () {
  function dispatchEvents(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function triggerJQueryChange(element, value) {
    const jQuery = window.jQuery || window.$;
    if (!jQuery) {
      return;
    }

    const $element = jQuery(element);
    $element.val(value);

    if (typeof $element.inputmask === 'function') {
      try {
        $element.inputmask('setvalue', value);
      } catch (error) {
        // inputmask may not be initialized on this element
      }
    }

    $element.trigger({
      type: 'change',
      context: 'autoFillForm',
    });
  }

  function findSelect2NativeSelect(element) {
    if (element.tagName === 'SELECT') {
      return element;
    }

    const container = element.closest('.select2-container');
    if (!container) {
      return null;
    }

    const selectId = container.previousElementSibling?.id;
    if (selectId) {
      return document.getElementById(selectId);
    }

    return container.parentElement?.querySelector('select') || null;
  }

  function fillSelectElement(selectElement, value, fieldType) {
    if (fieldType === 'select_dynamic') {
      const firstValidOption = Array.from(selectElement.options).find((option) => option.value !== '' && !option.disabled);
      if (firstValidOption) {
        selectElement.value = firstValidOption.value;
        dispatchEvents(selectElement);
        triggerJQueryChange(selectElement, firstValidOption.value);
        return true;
      }
      return false;
    }

    const stringValue = String(value);
    let matched = Array.from(selectElement.options).find((option) => option.value === stringValue);
    if (!matched) {
      matched = Array.from(selectElement.options).find((option) => normalizeOptionText(option.text) === normalizeOptionText(stringValue));
    }
    if (!matched && fieldType === 'grazhdanstvo') {
      matched = Array.from(selectElement.options).find((option) => option.text.includes(stringValue) || stringValue.includes(option.text));
    }

    if (matched) {
      selectElement.value = matched.value;
      dispatchEvents(selectElement);
      triggerJQueryChange(selectElement, matched.value);
      return true;
    }

    return false;
  }

  function normalizeOptionText(text) {
    return (text || '').trim().toLowerCase();
  }

  function fillPhoneField(element, value) {
    const selectElement = findSelect2NativeSelect(element) || (element.tagName === 'SELECT' ? element : null);
    if (selectElement) {
      const jQuery = window.jQuery || window.$;
      if (jQuery && jQuery(selectElement).data('select2')) {
        const newOption = new Option(value, value, true, true);
        jQuery(selectElement).append(newOption).trigger('change');
        return true;
      }

      selectElement.value = value;
      dispatchEvents(selectElement);
      triggerJQueryChange(selectElement, value);
      return true;
    }

    element.value = value;
    dispatchEvents(element);
    triggerJQueryChange(element, value);
    return true;
  }

  function fillTextLikeField(element, value) {
    element.value = value;
    dispatchEvents(element);
    triggerJQueryChange(element, value);
    return true;
  }

  function fillElement(element, fieldType, value) {
    if (!element || !AutoFillFieldDetector.isFillableElement(element)) {
      return false;
    }

    if (element.tagName === 'SELECT') {
      return fillSelectElement(element, value, fieldType);
    }

    if (fieldType === 'phone') {
      return fillPhoneField(element, value);
    }

    const selectElement = findSelect2NativeSelect(element);
    if (selectElement) {
      return fillPhoneField(selectElement, value);
    }

    return fillTextLikeField(element, value);
  }

  function resolveElementValue(element, fieldType, fallbackValue) {
    const preferredValue = AutoFillSettings.getPreferredValue(element);
    if (preferredValue !== null) {
      return preferredValue;
    }

    return fallbackValue;
  }

  function fillGroupFioFields(groupKey, poolIndex, fioFields) {
    let filledCount = 0;
    const personValues = AutoFillDataLoader.getPersonFioValues(poolIndex);
    if (!personValues) {
      return filledCount;
    }

    const groupFields = fioFields.filter((field) => field.groupKey === groupKey);
    const fillOrder = groupFields.some((field) => AutoFillFioGrouper.isGenderFieldType(field.fieldType))
      ? ['gender', ...AutoFillFioGrouper.FIO_NAME_FILL_ORDER]
      : AutoFillFioGrouper.FIO_NAME_FILL_ORDER;

    for (const fieldType of fillOrder) {
      const groupField = groupFields.find((field) => field.fieldType === fieldType);
      if (!groupField) {
        continue;
      }

      const value = groupField.value ?? resolveElementValue(
        groupField.element,
        fieldType,
        personValues[fieldType]
      );
      if (value === undefined) {
        continue;
      }

      const isFilled = fillElement(groupField.element, fieldType, value);
      if (isFilled) {
        filledCount += 1;
      }
    }

    return filledCount;
  }

  function fillFields(fields) {
    let filledCount = 0;
    const { fieldsWithMeta, groupIndexMap } = AutoFillFioGrouper.buildGroupIndexMap(fields);
    const filledFioGroups = new Set();

    const fioFields = fieldsWithMeta.filter((field) => AutoFillFioGrouper.isFioFieldType(field.fieldType));
    const otherFields = fieldsWithMeta.filter((field) => !AutoFillFioGrouper.isFioFieldType(field.fieldType));

    for (const field of fioFields) {
      if (filledFioGroups.has(field.groupKey)) {
        continue;
      }

      if (!AutoFillFioGrouper.groupHasFioNameFields(fioFields, field.groupKey)) {
        continue;
      }

      filledFioGroups.add(field.groupKey);
      const poolIndex = groupIndexMap.get(field.groupKey) ?? AutoFillDataLoader.getRandomPoolIndex();
      filledCount += fillGroupFioFields(field.groupKey, poolIndex, fioFields);
    }

    for (const field of otherFields) {
      const fallbackValue = AutoFillFioGrouper.resolveFieldValue(
        field.fieldType,
        field.groupKey,
        groupIndexMap
      );
      const value = field.value ?? resolveElementValue(field.element, field.fieldType, fallbackValue);
      const isFilled = fillElement(field.element, field.fieldType, value);
      if (isFilled) {
        filledCount += 1;
      }
    }

    return filledCount;
  }

  function fillSingleElement(element) {
    const fieldType = AutoFillFieldDetector.detectFieldType(element);
    if (!fieldType) {
      return { filled: false, fieldType: null };
    }

    const root = AutoFillFieldDetector.getFormRoot(element);
    const groupKey = AutoFillFioGrouper.getFieldGroupKey(element);
    const poolIndex = AutoFillDataLoader.getRandomPoolIndex();
    const personValues = AutoFillDataLoader.getPersonFioValues(poolIndex);

    if (AutoFillFioGrouper.isFioFieldType(fieldType) && personValues) {
      const relatedFioFields = AutoFillFioGrouper.getRelatedFioFields(element, root);
      let filledCount = 0;
      const filledTypes = [];

      const fillOrder = relatedFioFields.some((field) => AutoFillFioGrouper.isGenderFieldType(field.fieldType))
        ? ['gender', ...AutoFillFioGrouper.FIO_NAME_FILL_ORDER]
        : AutoFillFioGrouper.FIO_NAME_FILL_ORDER;

      for (const fieldTypeToFill of fillOrder) {
        const relatedField = relatedFioFields.find((field) => field.fieldType === fieldTypeToFill);
        if (!relatedField) {
          continue;
        }

        const value = resolveElementValue(
          relatedField.element,
          relatedField.fieldType,
          personValues[fieldTypeToFill]
        );
        if (value === undefined) {
          continue;
        }

        const isFilled = fillElement(relatedField.element, relatedField.fieldType, value);
        if (isFilled) {
          filledCount += 1;
          filledTypes.push(relatedField.fieldType);
        }
      }

      return {
        filled: filledCount > 0,
        fieldType,
        value: personValues[fieldType] ?? AutoFillDataLoader.getValueByIndex(fieldType, poolIndex),
        filledCount,
        filledTypes,
        groupKey,
      };
    }

    const fallbackValue = AutoFillDataLoader.getRandomValue(fieldType);
    const value = resolveElementValue(element, fieldType, fallbackValue);
    const filled = fillElement(element, fieldType, value);
    return { filled, fieldType, value, groupKey };
  }

  return {
    fillElement,
    fillFields,
    fillSingleElement,
  };
})();
