import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatSurnameForGender } from './surname-formatter.mjs';
import {
  surnamesEn,
  namesMaleEn,
  namesFemaleEn,
  middleNamesMaleEn,
  middleNamesFemaleEn,
  countriesEn,
  passportAuthoritiesEn,
  streetsEn,
  citiesEn,
} from './test-data-en.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'data', 'test-data.json');
const poolSize = 100;

const surnamesRu = [
  'Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Соколов',
  'Михайлов', 'Новиков', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов',
  'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев', 'Орлов', 'Андреев', 'Макаров',
  'Никитин', 'Захаров', 'Зайцев', 'Соловьёв', 'Борисов', 'Яковлев', 'Григорьев', 'Романов',
  'Воробьёв', 'Сергеев', 'Кузьмин', 'Фролов', 'Александров', 'Дмитриев', 'Королёв', 'Гусев',
  'Киселёв', 'Ильин', 'Максимов', 'Поляков', 'Сорокин', 'Виноградов', 'Ковалёв', 'Белов',
  'Медведев', 'Антонов', 'Тарасов', 'Жуков', 'Баранов', 'Филиппов', 'Комаров', 'Давыдов',
  'Беляев', 'Герасимов', 'Богданов', 'Осипов', 'Сидоренко', 'Матвеев', 'Титов', 'Марков',
  'Миронов', 'Крылов', 'Куликов', 'Карпов', 'Власов', 'Мельников', 'Денисов', 'Гаврилов',
  'Тихонов', 'Казаков', 'Афанасьев', 'Данилов', 'Савельев', 'Тимофеев', 'Фомин', 'Чернов',
  'Абрамов', 'Мартынов', 'Ефимов', 'Федотов', 'Щербаков', 'Назаров', 'Калинин', 'Исаев',
  'Чернышёв', 'Быков', 'Маслов', 'Родионов', 'Коновалов', 'Лазарев', 'Воронов', 'Климов',
  'Филатов', 'Пономарёв', 'Голубев', 'Кудрявцев', 'Прохоров', 'Наумов', 'Потапов', 'Журавлёв',
];

const namesMaleRu = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья',
  'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений', 'Иван',
  'Денис', 'Евгений', 'Даниил', 'Тимофей', 'Владислав', 'Игорь', 'Владимир', 'Павел',
  'Руслан', 'Марк', 'Константин', 'Тимур', 'Олег', 'Ярослав', 'Антон', 'Николай',
  'Глеб', 'Данил', 'Савелий', 'Вадим', 'Степан', 'Яков', 'Григорий', 'Семён',
  'Лев', 'Пётр', 'Богдан', 'Виктор', 'Захар', 'Фёдор', 'Георгий', 'Леонид',
  'Валерий', 'Василий', 'Виталий', 'Геннадий', 'Давид', 'Елисей', 'Захар', 'Игнат',
  'Клим', 'Лука', 'Мирон', 'Назар', 'Оскар', 'Платон', 'Роберт', 'Святослав',
  'Тарас', 'Ульян', 'Филипп', 'Харитон', 'Эдуард', 'Юрий', 'Ян', 'Аркадий',
  'Борис', 'Валентин', 'Герман', 'Демьян', 'Ефим', 'Ждан', 'Игнатий', 'Карл',
  'Лаврентий', 'Макар', 'Нестор', 'Остап', 'Прохор', 'Родион', 'Савва', 'Тихон',
  'Устин', 'Фома', 'Харлампий', 'Цезарь', 'Эмиль', 'Юлиан', 'Яромир', 'Авдей',
];

const namesFemaleRu = [
  'Анна', 'Мария', 'Елена', 'Дарья', 'Алина', 'Ирина', 'Екатерина', 'Арина',
  'Полина', 'Ольга', 'Юлия', 'Татьяна', 'Наталья', 'Виктория', 'Елизавета', 'Ксения',
  'Милана', 'Вероника', 'Алиса', 'Валерия', 'София', 'Ульяна', 'Кристина', 'Варвара',
  'Диана', 'Ева', 'Маргарита', 'Анастасия', 'Вера', 'Галина', 'Жанна', 'Злата',
  'Инна', 'Карина', 'Лариса', 'Людмила', 'Марина', 'Надежда', 'Оксана', 'Раиса',
  'Светлана', 'Тамара', 'Ульяна', 'Фаина', 'Элина', 'Яна', 'Агата', 'Божена',
  'Василиса', 'Глафира', 'Доминика', 'Евгения', 'Зинаида', 'Инга', 'Клара', 'Лидия',
  'Майя', 'Нина', 'Олеся', 'Пелагея', 'Регина', 'Снежана', 'Таисия', 'Ульяна',
  'Феодора', 'Христина', 'Цветана', 'Эмма', 'Юлиана', 'Ярослава', 'Аделина', 'Берта',
  'Виолетта', 'Герда', 'Дарина', 'Есения', 'Зоя', 'Ия', 'Камилла', 'Лилия',
  'Мелания', 'Нелли', 'Оливия', 'Прасковья', 'Роза', 'Стелла', 'Тереза', 'Ульрика',
  'Флора', 'Хельга', 'Эвелина', 'Юнона', 'Ядвига', 'Агния', 'Беата', 'Влада',
];

const patronymicsMaleRu = [
  'Иванович', 'Петрович', 'Сергеевич', 'Алексеевич', 'Дмитриевич', 'Андреевич', 'Николаевич',
  'Михайлович', 'Владимирович', 'Александрович', 'Евгеньевич', 'Павлович', 'Романович',
  'Артёмович', 'Максимович', 'Денисович', 'Олегович', 'Игоревич', 'Викторович', 'Юрьевич',
  'Борисович', 'Геннадьевич', 'Валерьевич', 'Анатольевич', 'Константинович', 'Фёдорович',
  'Григорьевич', 'Леонидович', 'Семёнович', 'Тимофеевич', 'Васильевич', 'Степанович',
  'Яковлевич', 'Платонович', 'Ростиславович', 'Святославович', 'Тарасович', 'Филиппович',
  'Эдуардович', 'Ярославович', 'Аркадьевич', 'Вадимович', 'Глебович', 'Давидович',
  'Егорович', 'Жданович', 'Захарович', 'Ильич', 'Кириллович', 'Львович', 'Маркович',
  'Назарович', 'Оскарович', 'Прохорович', 'Родионович', 'Савельевич', 'Тихонович',
  'Устинович', 'Фомич', 'Харитонович', 'Цезаревич', 'Эмильевич', 'Юлианович', 'Янович',
  'Авдеевич', 'Богданович', 'Витальевич', 'Германович', 'Даниилович', 'Ефимович',
  'Игнатьевич', 'Климович', 'Лаврентьевич', 'Макарович', 'Несторович', 'Остапович',
  'Платонович', 'Робертович', 'Саввич', 'Тарасович', 'Ульянович', 'Федорович',
  'Харлампиевич', 'Эдуардович', 'Юрьевич', 'Яромирович', 'Антонович', 'Владиславович',
  'Георгиевич', 'Демьянович', 'Елисеевич', 'Зиновьевич', 'Игнатович', 'Карлович',
  'Леонтьевич', 'Миронович', 'Никитич', 'Олегович', 'Петрович', 'Русланович',
];

const patronymicsFemaleRu = [
  'Ивановна', 'Петровна', 'Сергеевна', 'Алексеевна', 'Дмитриевна', 'Андреевна', 'Николаевна',
  'Михайловна', 'Владимировна', 'Александровна', 'Евгеньевна', 'Павловна', 'Романовна',
  'Артёмовна', 'Максимовна', 'Денисовна', 'Олеговна', 'Игоревна', 'Викторовна', 'Юрьевна',
  'Борисовна', 'Геннадьевна', 'Валерьевна', 'Анатольевна', 'Константиновна', 'Фёдоровна',
  'Григорьевна', 'Леонидовна', 'Семёновна', 'Тимофеевна', 'Васильевна', 'Степановна',
  'Яковлевна', 'Платоновна', 'Ростиславовна', 'Святославовна', 'Тарасовна', 'Филипповна',
  'Эдуардовна', 'Ярославовна', 'Аркадьевна', 'Вадимовна', 'Глебовна', 'Давидовна',
  'Егоровна', 'Ждановна', 'Захаровна', 'Ильинична', 'Кирилловна', 'Львовна', 'Марковна',
  'Назаровна', 'Оскаровна', 'Прохоровна', 'Родионовна', 'Савельевна', 'Тихоновна',
  'Устиновна', 'Фоминична', 'Харитоновна', 'Цезаревна', 'Эмильевна', 'Юлиановна', 'Яновна',
  'Авдеевна', 'Богдановна', 'Витальевна', 'Германовна', 'Данииловна', 'Ефимовна',
  'Игнатьевна', 'Климовна', 'Лаврентьевна', 'Макаровна', 'Несторовна', 'Остаповна',
  'Платоновна', 'Робертовна', 'Саввична', 'Тарасовна', 'Ульяновна', 'Федоровна',
  'Харлампиевна', 'Эдуардовна', 'Юрьевна', 'Яромировна', 'Антоновна', 'Владиславовна',
  'Георгиевна', 'Демьяновна', 'Елисеевна', 'Зиновьевна', 'Игнатовна', 'Карловна',
  'Леонтьевна', 'Мироновна', 'Никитична', 'Олеговна', 'Петровна', 'Руслановна',
];

const countriesRu = [
  'Россия', 'Абхазия', 'Австралия', 'Австрия', 'Азербайджан', 'Албания', 'Алжир', 'Аргентина',
  'Армения', 'Беларусь', 'Бельгия', 'Болгария', 'Бразилия', 'Великобритания', 'Венгрия', 'Вьетнам',
  'Германия', 'Греция', 'Грузия', 'Дания', 'Египет', 'Израиль', 'Индия', 'Индонезия',
  'Ирландия', 'Испания', 'Италия', 'Казахстан', 'Канада', 'Китай', 'Колумбия', 'Корея, Республика',
  'Куба', 'Кыргызстан', 'Латвия', 'Литва', 'Люксембург', 'Малайзия', 'Мексика', 'Молдова',
  'Монголия', 'Нидерланды', 'Норвегия', 'ОАЭ', 'Польша', 'Португалия', 'Румыния', 'Сербия',
  'Сингапур', 'Словакия', 'Словения', 'США', 'Таджикистан', 'Таиланд', 'Турция', 'Туркменистан',
  'Узбекистан', 'Украина', 'Финляндия', 'Франция', 'Хорватия', 'Чехия', 'Чили', 'Швейцария',
  'Швеция', 'Эстония', 'Япония', 'Афганистан', 'Бангладеш', 'Бахрейн', 'Боливия', 'Босния и Герцеговина',
  'Ботсвана', 'Венесуэла', 'Гана', 'Гватемала', 'Гондурас', 'Доминикана', 'Замбия', 'Иордания',
  'Ирак', 'Иран', 'Исландия', 'Йемен', 'Камбоджа', 'Катар', 'Кения', 'Кипр', 'Коста-Рика',
  'Кувейт', 'Ливан', 'Ливия', 'Марокко', 'Непал', 'Нигерия', 'Новая Зеландия', 'Оман',
  'Пакистан', 'Панама', 'Парагвай', 'Перу', 'Саудовская Аравия', 'Сенегал', 'Сирия', 'Судан',
  'Тунис', 'Уругвай', 'Филиппины', 'Эквадор', 'Эфиопия', 'ЮАР',
];

const passportAuthoritiesRu = [
  'ОТДЕЛЕНИЕМ УФМС РОССИИ ПО Г. МОСКВЕ',
  'ОТДЕЛЕНИЕМ УФМС РОССИИ ПО МОСКОВСКОЙ ОБЛАСТИ',
  'ОТДЕЛЕНИЕМ УФМС РОССИИ ПО СПБ И ЛЕНИНГРАДСКОЙ ОБЛ.',
  'МВД РОССИИ ПО Г. МОСКВЕ',
  'МВД РОССИИ ПО КРАСНОДАРСКОМУ КРАЮ',
  'МВД РОССИИ ПО СВЕРДЛОВСКОЙ ОБЛАСТИ',
  'МВД РОССИИ ПО НОВОСИБИРСКОЙ ОБЛАСТИ',
  'МВД РОССИИ ПО РЕСПУБЛИКЕ ТАТАРСТАН',
  'МВД РОССИИ ПО РОСТОВСКОЙ ОБЛАСТИ',
  'МВД РОССИИ ПО САМАРСКОЙ ОБЛАСТИ',
];

const streetsRu = [
  'ул. Ленина', 'ул. Пушкина', 'ул. Гагарина', 'ул. Советская', 'ул. Мира', 'ул. Садовая',
  'ул. Центральная', 'ул. Новая', 'ул. Зелёная', 'ул. Школьная', 'ул. Молодёжная', 'ул. Лесная',
  'пр. Победы', 'пр. Мира', 'пр. Ленина', 'наб. Речная', 'пер. Тихий', 'ул. Комсомольская',
  'ул. Парковая', 'ул. Солнечная',
];

const citiesRu = [
  'г. Москва', 'г. Санкт-Петербург', 'г. Казань', 'г. Новосибирск', 'г. Екатеринбург',
  'г. Нижний Новгород', 'г. Краснодар', 'г. Самара', 'г. Ростов-на-Дону', 'г. Воронеж',
  'г. Уфа', 'г. Пермь', 'г. Волгоград', 'г. Омск', 'г. Челябинск', 'г. Тюмень',
  'г. Иркутск', 'г. Хабаровск', 'г. Ярославль', 'г. Тула',
];

const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const cyrillicPairs = ['АБ', 'ВГ', 'ДЕ', 'ЖЗ', 'ИК', 'ЛМ', 'НО', 'ПР', 'СТ', 'УФ', 'ХЦ', 'ЧШ'];

function padNumber(value, length) {
  return String(value).padStart(length, '0');
}

function pickFrom(array, index) {
  return array[index % array.length];
}

function generateLocalePool(localeConfig) {
  const data = {
    persons: [],
    surname: [],
    name: [],
    patronimyc: [],
    gender: [],
    email: [],
    phone: [],
    birth: [],
    passport: [],
    passport_from: [],
    passport_register: [],
    grazhdanstvo: [],
    tourist_type: [],
    birth_certificate: [],
    adress: [],
    number: [],
    text: [],
  };

  for (let index = 0; index < poolSize; index += 1) {
    const isMale = index % 2 === 1;
    const surnameBase = `${pickFrom(localeConfig.surnames, index)}${index > 50 ? index : ''}`.slice(0, 50);
    const surname = localeConfig.useSurnameDeclension
      ? formatSurnameForGender(surnameBase, isMale)
      : surnameBase;

    const person = {
      gender: isMale ? '1' : '0',
      surname,
      name: pickFrom(isMale ? localeConfig.namesMale : localeConfig.namesFemale, index),
      patronimyc: pickFrom(isMale ? localeConfig.patronymicsMale : localeConfig.patronymicsFemale, index),
    };

    data.persons.push(person);
    data.surname.push(person.surname);
    data.name.push(person.name);
    data.patronimyc.push(person.patronimyc);
    data.gender.push(person.gender);

    data.email.push(localeConfig.buildEmail(index));
    data.phone.push(localeConfig.buildPhone(index));

    const birthYear = 1950 + (index % 55);
    const birthMonth = padNumber((index % 12) + 1, 2);
    const birthDay = padNumber((index % 28) + 1, 2);
    data.birth.push(`${birthDay}.${birthMonth}.${birthYear}`);

    const passportSeries = padNumber(4500 + (index % 100), 4);
    const passportNumber = padNumber(100000 + index * 137, 6);
    data.passport.push(`${passportSeries} ${passportNumber}`);

    data.passport_from.push(localeConfig.buildPassportFrom(index, birthDay, birthMonth, birthYear));
    data.passport_register.push(localeConfig.buildPassportRegister(index));
    data.grazhdanstvo.push(pickFrom(localeConfig.countries, index));
    data.tourist_type.push(String(index % 6));
    data.birth_certificate.push(localeConfig.buildBirthCertificate(index));
    data.adress.push(localeConfig.buildAddress(index));
    data.number.push(String(100 + (index * 317) % 49900));
    data.text.push(localeConfig.buildText(index));
  }

  return data;
}

const ruLocaleConfig = {
  surnames: surnamesRu,
  namesMale: namesMaleRu,
  namesFemale: namesFemaleRu,
  patronymicsMale: patronymicsMaleRu,
  patronymicsFemale: patronymicsFemaleRu,
  countries: countriesRu,
  useSurnameDeclension: true,
  buildEmail: (index) => `test.user${padNumber(index + 1, 3)}@example.com`,
  buildPhone: (index) => {
    const phoneCode = padNumber(10 + (index % 90), 2);
    const phoneBlock = padNumber(100 + (index % 900), 3);
    const phonePart1 = padNumber(index % 100, 2);
    const phonePart2 = padNumber((index * 7) % 100, 2);
    return `+7 (9${phoneCode}) ${phoneBlock}-${phonePart1}-${phonePart2}`;
  },
  buildPassportFrom: (index, birthDay, birthMonth, birthYear) =>
    `${pickFrom(passportAuthoritiesRu, index)}, ${pickFrom(citiesRu, index)}, ${birthDay}.${birthMonth}.${2000 + (index % 24)}`,
  buildPassportRegister: (index) =>
    `${pickFrom(citiesRu, index)}, ${pickFrom(streetsRu, index)}, д. ${(index % 120) + 1}, кв. ${(index % 200) + 1}`,
  buildBirthCertificate: (index) => {
    const roman = pickFrom(romanNumerals, index);
    const letters = pickFrom(cyrillicPairs, index);
    return `${roman}-${letters} ${padNumber(100000 + index, 6)}`;
  },
  buildAddress: (index) =>
    `${pickFrom(citiesRu, index)}, ${pickFrom(streetsRu, index)}, д. ${(index % 100) + 1}, кв. ${(index % 150) + 1}, подъезд ${(index % 4) + 1}`,
  buildText: (index) => `Тестовое значение ${index + 1} для автозаполнения формы`,
};

const enLocaleConfig = {
  surnames: surnamesEn,
  namesMale: namesMaleEn,
  namesFemale: namesFemaleEn,
  patronymicsMale: middleNamesMaleEn,
  patronymicsFemale: middleNamesFemaleEn,
  countries: countriesEn,
  useSurnameDeclension: false,
  buildEmail: (index) => `test.user${padNumber(index + 1, 3)}@example.com`,
  buildPhone: (index) => {
    const areaCode = padNumber(200 + (index % 800), 3);
    const prefix = padNumber(100 + (index % 900), 3);
    const lineNumber = padNumber(1000 + (index * 13) % 9000, 4);
    return `+1 (${areaCode}) ${prefix}-${lineNumber}`;
  },
  buildPassportFrom: (index, birthDay, birthMonth, birthYear) =>
    `${pickFrom(passportAuthoritiesEn, index)}, ${pickFrom(citiesEn, index)}, ${birthMonth}/${birthDay}/${2000 + (index % 24)}`,
  buildPassportRegister: (index) =>
    `${(index % 999) + 1} ${pickFrom(streetsEn, index)}, ${pickFrom(citiesEn, index)}`,
  buildBirthCertificate: (index) => `AB${padNumber(100000 + index, 6)}`,
  buildAddress: (index) =>
    `${(index % 999) + 1} ${pickFrom(streetsEn, index)}, ${pickFrom(citiesEn, index)}`,
  buildText: (index) => `Test value ${index + 1} for form autofill`,
};

mkdirSync(dirname(outputPath), { recursive: true });
const testData = {
  locales: {
    ru: generateLocalePool(ruLocaleConfig),
    en: generateLocalePool(enLocaleConfig),
  },
};

writeFileSync(outputPath, JSON.stringify(testData, null, 2), 'utf8');

console.log(`Generated ${poolSize} values per locale -> ${outputPath}`);
