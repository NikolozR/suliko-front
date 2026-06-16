export const languages = [
  'georgian',
  'english',
  'russian',
  'azerbaijani',
  'turkish',
  'italian',
  'armenian',
  'german',
  'french',
  'latvian',
  'slovak',
  'hebrew',
  'arabic',
  'spanish',
  'portuguese',
  'dutch',
  'swedish',
  'norwegian',
  'finnish',
  'chinese',
  'japanese',
  'korean',
] as const;

export type Language = typeof languages[number];

export const languagePrices: Record<Language, number> = {
  georgian: 15,

  english: 22.5,
  russian: 22.5,

  azerbaijani: 25,
  turkish: 25,

  italian: 30,
  armenian: 30,
  german: 30,
  french: 30,
  latvian: 30,
  slovak: 30,

  hebrew: 45,

  arabic: 50,

  spanish: 70,
  portuguese: 70,
  dutch: 70,
  swedish: 70,
  norwegian: 70,
  finnish: 70,

  chinese: 100,

  japanese: 100,
  korean: 100,
};

export const languageTranslations: Record<string, Record<Language, string>> = {
  en: {
    georgian: 'Georgian',

    english: 'English',
    russian: 'Russian',

    azerbaijani: 'Azerbaijani',
    turkish: 'Turkish',

    italian: 'Italian',
    armenian: 'Armenian',
    german: 'German',
    french: 'French',
    latvian: 'Latvian',
    slovak: 'Slovak',

    hebrew: 'Hebrew',

    arabic: 'Arabic',

    spanish: 'Spanish',
    portuguese: 'Portuguese',
    dutch: 'Dutch',
    swedish: 'Swedish',
    norwegian: 'Norwegian',
    finnish: 'Finnish',

    chinese: 'Chinese',

    japanese: 'Japanese',
    korean: 'Korean',
  },

  ka: {
    georgian: 'ქართული',

    english: 'ინგლისური',
    russian: 'რუსული',

    azerbaijani: 'აზერბაიჯანული',
    turkish: 'თურქული',

    italian: 'იტალიური',
    armenian: 'სომხური',
    german: 'გერმანული',
    french: 'ფრანგული',
    latvian: 'ლატვიური',
    slovak: 'სლოვაკური',

    hebrew: 'ებრაული',

    arabic: 'არაბული',

    spanish: 'ესპანური',
    portuguese: 'პორტუგალიური',
    dutch: 'ჰოლანდიური',
    swedish: 'შვედური',
    norwegian: 'ნორვეგიული',
    finnish: 'ფინური',

    chinese: 'ჩინური',

    japanese: 'იაპონური',
    korean: 'კორეული',
  },

  pl: {
    georgian: 'Gruziński',

    english: 'Angielski',
    russian: 'Rosyjski',

    azerbaijani: 'Azerbejdżański',
    turkish: 'Turecki',

    italian: 'Włoski',
    armenian: 'Ormiański',
    german: 'Niemiecki',
    french: 'Francuski',
    latvian: 'Łotewski',
    slovak: 'Słowacki',

    hebrew: 'Hebrajski',

    arabic: 'Arabski',

    spanish: 'Hiszpański',
    portuguese: 'Portugalski',
    dutch: 'Holenderski',
    swedish: 'Szwedzki',
    norwegian: 'Norweski',
    finnish: 'Fiński',

    chinese: 'Chiński',

    japanese: 'Japoński',
    korean: 'Koreański',
  },
};