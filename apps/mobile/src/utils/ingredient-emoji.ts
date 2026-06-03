const EMOJI_BY_KEYWORD: [string, string][] = [
  ["manjeric", "🌿"],
  ["limão", "🍋"],
  ["limao", "🍋"],
  ["frango", "🍗"],
  ["batata", "🥔"],
  ["cebola", "🧅"],
  ["leite", "🥛"],
  ["iogurte", "🥣"],
  ["macarr", "🍝"],
  ["massa", "🍝"],
  ["azeite", "🫒"],
  ["alho", "🧄"],
  ["tomate", "🍅"],
  ["queijo", "🧀"],
  ["parmes", "🧀"],
  ["ovo", "🥚"],
  ["castanh", "🌰"],
  ["noz", "🥜"],
  ["nozes", "🥜"],
  ["sal", "🧂"],
  ["arroz", "🍚"],
  ["feij", "🫘"],
  ["abob", "🎃"],
  ["cenoura", "🥕"],
  ["pepino", "🥒"],
  ["piment", "🌶️"],
  ["limão", "🍋"],
  ["banana", "🍌"],
  ["maçã", "🍎"],
  ["maca", "🍎"],
  ["abacate", "🥑"],
  ["peixe", "🐟"],
  ["camar", "🦐"],
  ["carne", "🥩"],
  ["pão", "🍞"],
  ["pao", "🍞"],
  ["chocolate", "🍫"],
  ["açúcar", "🍬"],
  ["acucar", "🍬"],
  ["mel", "🍯"],
  ["café", "☕"],
  ["cafe", "☕"],
];

export const emojiForIngredient = (name: string): string => {
  const lower = name.trim().toLowerCase();
  if (!lower) return "🛒";
  for (const [keyword, emoji] of EMOJI_BY_KEYWORD) {
    if (lower.includes(keyword)) return emoji;
  }
  return "🛒";
};

export const normalizeIngredientName = (name: string): string =>
  name.trim().toLowerCase();
