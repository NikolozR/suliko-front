export const languages = [
  'georgian', 'english', 'russian', 'german', 'french', 'spanish',
  'italian', 'latvian', 'slovak', 'chinese', 'japanese', 'korean',
  'portuguese'
] as const;

export type Language = typeof languages[number];

export const languagePrices: Record<Language, number> = {
  georgian: 15,
  english: 22.5,
  russian: 22.5,
  german: 30,
  french: 30,
  spanish: 30,
  italian: 30,
  latvian: 30,
  slovak: 30,
  chinese: 30,
  japanese: 30,
  korean: 30,
  portuguese: 30,
};

export const languageTranslations: Record<string, Record<Language, string>> = {
  en: {
    georgian: 'Georgian', english: 'English', russian: 'Russian',
    german: 'German', french: 'French', spanish: 'Spanish',
    italian: 'Italian', latvian: 'Latvian', slovak: 'Slovak',
    chinese: 'Chinese', japanese: 'Japanese', korean: 'Korean',
    portuguese: 'Portuguese'
  },
  ka: {
    georgian: 'ქართული', english: 'ინგლისური', russian: 'რუსული',
    german: 'გერმანული', french: 'ფრანგული', spanish: 'ესპანური',
    italian: 'იტალიური', latvian: 'ლატვიური', slovak: 'სლოვაკური',
    chinese: 'ჩინური', japanese: 'იაპონური', korean: 'კორეული',
   portuguese: 'პორტუგალიური'
  },
  pl: {
    georgian: 'Gruziński', english: 'Angielski', russian: 'Rosyjski',
    german: 'Niemiecki', french: 'Francuski', spanish: 'Hiszpański',
    italian: 'Włoski', latvian: 'Łotewski', slovak: 'Słowacki',
    chinese: 'Chiński', japanese: 'Japoński', korean: 'Koreański',
    portuguese: 'Portugalski'
  },
};
