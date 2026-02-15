export type IngredientCategory =
  | 'Mejeri'
  | 'Grönsaker'
  | 'Frukt'
  | 'Kött'
  | 'Fisk'
  | 'Spannmål'
  | 'Kryddor'
  | 'Övrigt';

const categoryPatterns: Record<IngredientCategory, string[]> = {
  Mejeri: [
    'mjölk',
    'grädde',
    'ost',
    'smör',
    'yoghurt',
    'fil',
    'crème fraiche',
    'creme fraiche',
    'kesella',
    'kvarg',
    'ägg',
  ],
  Grönsaker: [
    'tomat',
    'gurka',
    'paprika',
    'lök',
    'vitlök',
    'morot',
    'potatis',
    'sallad',
    'spenat',
    'broccoli',
    'blomkål',
    'zucchini',
    'aubergine',
    'pumpa',
    'squash',
    'purjolök',
    'selleri',
    'palsternacka',
    'rova',
    'kål',
    'brysselkål',
    'majs',
    'ärtor',
    'bönor',
    'linser',
    'kikärtor',
    'champinjon',
    'svamp',
  ],
  Frukt: [
    'äpple',
    'päron',
    'banan',
    'apelsin',
    'citron',
    'lime',
    'vindruvr',
    'melon',
    'ananas',
    'mango',
    'avokado',
    'tomat',
    'bär',
    'hallon',
    'blåbär',
    'jordgubbar',
  ],
  Kött: [
    'kyckling',
    'köttfärs',
    'nötkött',
    'fläsk',
    'bacon',
    'korv',
    'skinka',
    'kalv',
    'lamm',
    'kött',
    'fågel',
  ],
  Fisk: [
    'lax',
    'torsk',
    'sill',
    'räka',
    'kräfta',
    'tonfisk',
    'fisk',
    'skaldjur',
    'musslor',
    'hummer',
  ],
  Spannmål: [
    'pasta',
    'ris',
    'mjöl',
    'bröd',
    'havregryn',
    'quinoa',
    'bulgur',
    'couscous',
    'vete',
    'råg',
    'korngryn',
    'makaroner',
    'spaghetti',
    'nudlar',
  ],
  Kryddor: [
    'salt',
    'peppar',
    'paprikapulver',
    'chili',
    'curry',
    'basilika',
    'oregano',
    'timjan',
    'rosmarin',
    'persilja',
    'dill',
    'koriander',
    'spiskummin',
    'ingefära',
    'kanel',
    'kardemumma',
    'nejlika',
    'vanilj',
    'senap',
    'ketchup',
    'soja',
    'vinäger',
    'olja',
    'olivolja',
    'rapsolja',
    'honung',
    'sirap',
    'socker',
    'krydda',
  ],
  Övrigt: [],
};

export function categorizeIngredient(ingredient: string): IngredientCategory {
  const normalized = ingredient.toLowerCase().trim();

  // Check each category
  for (const [category, patterns] of Object.entries(categoryPatterns) as [
    IngredientCategory,
    string[]
  ][]) {
    if (category === 'Övrigt') continue;

    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return category;
      }
    }
  }

  return 'Övrigt';
}
