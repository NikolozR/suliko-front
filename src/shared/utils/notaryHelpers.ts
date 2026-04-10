export const languages = [
  'georgian', 'english', 'russian', 'german', 'french', 'spanish',
  'italian', 'latvian', 'slovak', 'chinese', 'japanese', 'korean',
  'arabic', 'portuguese', 'dutch', 'swedish', 'norwegian', 'finnish',
  'jewish', 'azerbaijani', 'turkish', 'armenian',
] as const;

export type Language = typeof languages[number];

export const languagePrices: Record<Language, number> = {
  georgian: 15,
  english: 22.5,
  russian: 22.5,
  german: 35,
  french: 35,
  spanish: 50,
  italian: 35,
  latvian: 35,
  slovak: 37.5,
  chinese: 72.5,
  japanese: 100,
  korean: 100,
  arabic: 57.5,
  portuguese: 50,
  dutch: 50,
  swedish: 35,
  norwegian: 35,
  finnish: 35,
  jewish: 50,
  azerbaijani: 27.5,
  turkish: 25,
  armenian: 25,
};

export const languageTranslations: Record<string, Record<Language, string>> = {
  en: {
    georgian: 'Georgian', english: 'English', russian: 'Russian',
    german: 'German', french: 'French', spanish: 'Spanish',
    italian: 'Italian', latvian: 'Latvian', slovak: 'Slovak',
    chinese: 'Chinese', japanese: 'Japanese', korean: 'Korean',
    arabic: 'Arabic', portuguese: 'Portuguese', dutch: 'Dutch',
    swedish: 'Swedish', norwegian: 'Norwegian', finnish: 'Finnish',
    jewish: 'Hebrew', azerbaijani: 'Azerbaijani', turkish: 'Turkish',
    armenian: 'Armenian',
  },
  ka: {
    georgian: 'ქართული', english: 'ინგლისური', russian: 'რუსული',
    german: 'გერმანული', french: 'ფრანგული', spanish: 'ესპანური',
    italian: 'იტალიური', latvian: 'ლატვიური', slovak: 'სლოვაკური',
    chinese: 'ჩინური', japanese: 'იაპონური', korean: 'კორეული',
    arabic: 'არაბული', portuguese: 'პორტუგალიური', dutch: 'ჰოლანდიური',
    swedish: 'შვედური', norwegian: 'ნორვეგიული', finnish: 'ფინური',
    jewish: 'ებრაული', azerbaijani: 'აზერბაიჯანული', turkish: 'თურქული',
    armenian: 'სომხური',
  },
  pl: {
    georgian: 'Gruziński', english: 'Angielski', russian: 'Rosyjski',
    german: 'Niemiecki', french: 'Francuski', spanish: 'Hiszpański',
    italian: 'Włoski', latvian: 'Łotewski', slovak: 'Słowacki',
    chinese: 'Chiński', japanese: 'Japoński', korean: 'Koreański',
    arabic: 'Arabski', portuguese: 'Portugalski', dutch: 'Holenderski',
    swedish: 'Szwedzki', norwegian: 'Norweski', finnish: 'Fiński',
    jewish: 'Hebrajski', azerbaijani: 'Azerbejdżański', turkish: 'Turecki',
    armenian: 'Ormiański',
  },
};
