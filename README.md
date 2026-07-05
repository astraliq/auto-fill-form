# Auto Fill Form

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Chrome extension (Manifest V3) that autofills web forms with realistic test data via the browser context menu.

Built for manual QA of any web form. Out of the box it recognizes common field patterns: full name, date of birth, passport details, phone, email, and more.

## Features

- Fill the **entire form** or a **single field** via right-click
- Pool of **100 test values** per field type
- **Consistent name and gender** within a group (tourist, client, DOM block)
- Russian surname declension by gender (`Киселёв` → `Киселёва`)
- Locales **ru** / **en** / random per fill operation
- Settings: exclude by `name`/`id`, skip `readonly`/`disabled`, preferred values
- Supports `input`, `select`, `textarea`, jQuery Inputmask, Select2

## Installation

### From source (developer mode)

1. Clone the repository:

```bash
git clone https://github.com/astraliq/auto-fill-form.git
cd auto-fill-form
```

2. Optionally regenerate test data and icons (prebuilt files are included):

```bash
node scripts/generate-test-data.mjs
node scripts/generate-icons.mjs
```

3. Open `chrome://extensions`
4. Enable **Developer mode**
5. Click **Load unpacked**
6. Select the **repository root folder**

Reload the extension on `chrome://extensions` after code updates.

## Usage

On any page with a form:

| Action | Result |
|--------|--------|
| **Right-click → “Fill entire form”** | Fills fields in the nearest `<form>` or across the page |
| **Right-click on a field → “Fill current field”** | Fills only the selected field (for name groups — related fields too) |

Each field gets a random value from the test data pool.

Click the extension icon on the toolbar to open settings.

## Settings

Settings are stored in `chrome.storage.sync` and apply immediately after saving.

### Exclude words

Comma-separated. Fields whose `name` or `id` contains any listed word (case-insensitive) are skipped.

```text
to_pay, agent_profit, promotion_id
```

### Skip fields

- **readonly** — do not fill read-only fields (enabled by default)
- **disabled** — do not fill disabled fields (enabled by default)

### Preferred values

Rules override test data. One rule per line:

```text
tourist_type=0,2
clients-tels=+7 (900) 111-11-11,+7 (901) 222-22-22
gender=1,0
```

If a fragment appears in `name` or `id`, a random value from the list is used. The **first** matching rule from top to bottom wins.

### Fill language

| Mode | Description |
|------|-------------|
| **Russian** | Names, addresses, +7 phones, countries in Russian (default) |
| **English** | English names, addresses, +1 phones, countries in English |
| **Random** | Randomly ru or en per fill operation; one language per operation keeps names consistent |

## Consistent names and gender

**Surname, first name, patronymic, and gender** fields are grouped when:

- `name` or `id` shares a common prefix/index (e.g. `Model[tourists][0][surname]` and `... [0][name]`);
- fields are in the same DOM block (`.row`, `.entity-card`, `#client-form`).

Each group uses one record from the `persons` array (100 profiles):

- if a **gender** field exists — gender, surname, first name, and patronymic come from the same record;
- if not — only consistent **surname, first name, and patronymic** are filled.

Filling a single name field via context menu also fills related fields in the same group.

## Supported field types

| Type | Example (ru) |
|------|--------------|
| Surname, first name, patronymic | Иванов, Александр, Петрович |
| Gender | `0` / `1` |
| Email | `test.user001@example.com` |
| Phone | `+7 (910) 100-00-00` |
| Date of birth | `01.01.1990` |
| Passport | `4500 100000` |
| Issued by / registration | authority, address |
| Citizenship | Russia, Germany, … |
| Tourist type | `0`–`5` |
| Birth certificate | `IV-АБ 123456` |
| Delivery address | Moscow, Lenin St., 1 |
| Numbers | `100`–`50000` |

### Field type detection

1. `data-attr_name` / `data-mini_selector`
2. `id` / `name` (`Clients[surname]`, `#clients-birth`)
3. CSS classes (`.passport`, `.birth_certificate`)
4. Generic heuristics (label, placeholder, `type`)

## Limitations

- Skipped: `hidden`, checkbox/radio, file; by default also `readonly` and `disabled`
- `promotion_id` / `promotion_admin_id` — first non-empty option is selected (DB-backed lists)
- Select2 phone fields: jQuery support; a second click may be needed in rare cases
- Fields in cross-origin iframes are not filled
- Hidden system fields (`id_client`, `id_place`, `place_cost`) are skipped

## Project structure

```
auto-fill-form/
  manifest.json
  background.js
  popup.html
  popup.js
  content/
    content.js
    field-detector.js
    field-filler.js
    data-loader.js
    settings.js
    fio-grouper.js
    surname-formatter.js
  data/
    test-data.json
  scripts/
    generate-test-data.mjs
    test-data-en.mjs
    surname-formatter.mjs
    generate-icons.mjs
  icons/
```

## Development

Regenerate test data (ru + en, 100 values per type):

```bash
node scripts/generate-test-data.mjs
```

Reload the extension on `chrome://extensions` after regeneration.

**Requirements:** Node.js 18+ (generation scripts only), Google Chrome or a Chromium browser with Manifest V3 support.

## License

Released under the [MIT](LICENSE) License — free to use, modify, and distribute with copyright notice retained.

---

# Auto Fill Form — Русский

Расширение для Chrome (Manifest V3): автозаполнение форм тестовыми данными через контекстное меню браузера.

Подходит для ручного тестирования любых веб-форм. Из коробки хорошо распознаёт поля форм: с ФИО, датой рождения и паспортными данными.

## Возможности

- Заполнение **всей формы** или **одного поля** через ПКМ
- Пул из **100 тестовых значений** на каждый тип поля
- **Согласованное ФИО и пол** внутри группы (турист, клиент, DOM-блок)
- Склонение русских фамилий по полу (`Киселёв` → `Киселёва`)
- Локали **ru** / **en** / случайный выбор на каждое заполнение
- Настройки: исключения по `name`/`id`, пропуск `readonly`/`disabled`, предпочтительные значения
- Поддержка `input`, `select`, `textarea`, jQuery Inputmask, Select2

## Установка

### Из исходников (режим разработчика)

1. Клонируйте репозиторий:

```bash
git clone https://github.com/astraliq/auto-fill-form.git
cd auto-fill-form
```

2. При необходимости сгенерируйте тестовые данные и иконки (в репозитории уже есть готовые файлы):

```bash
node scripts/generate-test-data.mjs
node scripts/generate-icons.mjs
```

3. Откройте `chrome://extensions`
4. Включите **Режим разработчика**
5. Нажмите **Загрузить распакованное расширение**
6. Укажите **корневую папку** клонированного репозитория

После обновления кода перезагрузите расширение на странице `chrome://extensions`.

## Использование

На любой странице с формой:

| Действие | Результат |
|----------|-----------|
| **ПКМ → «Заполнить всю форму»** | Заполняет поля в ближайшей `<form>` или на всей странице |
| **ПКМ по полю → «Заполнить текущее поле»** | Заполняет только выбранное поле (для ФИО — связанные поля группы) |

Каждое поле получает случайное значение из пула тестовых данных.

Настройки открываются по клику на иконку расширения на панели инструментов.

## Настройки

Настройки сохраняются в `chrome.storage.sync` и применяются сразу после сохранения.

### Слова для исключения

Через запятую. Поля, в `name` или `id` которых есть любое из слов (без учёта регистра), пропускаются.

```text
to_pay, agent_profit, promotion_id
```

### Пропускать поля

- **readonly** — не заполнять поля только для чтения (включено по умолчанию)
- **disabled** — не заполнять отключённые поля (включено по умолчанию)

### Предпочтительные значения

Правила с приоритетом над тестовыми данными. Одна строка — одно правило:

```text
tourist_type=0,2
clients-tels=+7 (900) 111-11-11,+7 (901) 222-22-22
gender=1,0
```

Если фрагмент встречается в `name` или `id`, подставляется случайное значение из списка. Используется **первое** совпавшее правило сверху вниз.

### Язык заполнения

| Режим | Описание |
|-------|----------|
| **Русский** | Фамилии, адреса, телефоны +7, гражданство на русском (по умолчанию) |
| **English** | Английские имена, адреса, телефоны +1, страны на английском |
| **Случайно** | На каждое заполнение случайно ru или en; внутри одной операции язык один, чтобы ФИО оставалось согласованным |

## Согласованное ФИО и пол

Поля **фамилия, имя, отчество и пол** группируются, если:

- в `name` или `id` есть общий префикс/индекс (например `Model[tourists][0][surname]` и `... [0][name]`);
- поля находятся в одном блоке DOM (строка `.row`, карточка `.entity-card`, блок `#client-form`).

Для каждой группы выбирается одна запись из массива `persons` (100 профилей):

- есть поле **пол** — заполняются пол, фамилия, имя и отчество из одной записи;
- поля **пол** нет — заполняются согласованные **фамилия, имя и отчество**.

При заполнении одного поля ФИО через контекстное меню связанные поля той же группы также заполняются согласованно.

## Поддерживаемые типы полей

| Тип | Пример (ru) |
|-----|-------------|
| Фамилия, имя, отчество | Иванов, Александр, Петрович |
| Пол | `0` / `1` |
| Email | `test.user001@example.com` |
| Телефон | `+7 (910) 100-00-00` |
| Дата рождения | `01.01.1990` |
| Паспорт | `4500 100000` |
| Кем выдан / регистрация | УФМС, адрес |
| Гражданство | Россия, Германия, … |
| Тип туриста | `0`–`5` |
| Свидетельство о рождении | `IV-АБ 123456` |
| Адрес доставки | г. Москва, ул. Ленина, д. 1 |
| Числа | `100`–`50000` |

### Как определяется тип поля

1. `data-attr_name` / `data-mini_selector`
2. `id` / `name` (`Clients[surname]`, `#clients-birth`)
3. CSS-классы (`.passport`, `.birth_certificate`)
4. Универсальные эвристики (label, placeholder, `type`)

## Ограничения

- Не заполняются: `hidden`, checkbox/radio, file; по умолчанию также `readonly` и `disabled`
- `promotion_id` / `promotion_admin_id` — выбирается первый непустой option (списки из БД)
- Select2-телефон: поддержка через jQuery; в редких случаях может потребоваться повторный клик
- Поля в cross-origin iframe не заполняются
- Скрытые системные поля (`id_client`, `id_place`, `place_cost`) пропускаются

## Структура проекта

```
auto-fill-form/
  manifest.json
  background.js
  popup.html
  popup.js
  content/
    content.js
    field-detector.js
    field-filler.js
    data-loader.js
    settings.js
    fio-grouper.js
    surname-formatter.js
  data/
    test-data.json
  scripts/
    generate-test-data.mjs
    test-data-en.mjs
    surname-formatter.mjs
    generate-icons.mjs
  icons/
```

## Разработка

Перегенерация тестовых данных (ru + en, по 100 значений на тип):

```bash
node scripts/generate-test-data.mjs
```

После перегенерации перезагрузите расширение в `chrome://extensions`.

**Требования:** Node.js 18+ (только для скриптов генерации), Google Chrome или Chromium-браузер с поддержкой Manifest V3.

## Лицензия

Проект распространяется под лицензией [MIT](LICENSE) — свободное использование, изменение и распространение с сохранением уведомления об авторских правах.
