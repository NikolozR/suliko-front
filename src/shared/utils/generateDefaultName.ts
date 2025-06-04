const words = [
  "ეკალი",
  "ვარდი",
  "კოკობი",
  "მარგალიტი",
  "ბულბული",
  "ჩიტუნა",
  "მგოსანი"
];

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function getRandomFourDigitNumber() {
  return String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
}

export function generateDefaultName() {
  return `${getRandomWord()}_${getRandomFourDigitNumber()}`;
} 