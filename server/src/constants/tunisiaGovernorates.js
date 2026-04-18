const TUNISIA_GOVERNORATES = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Le Kef',
  'Mahdia',
  'La Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
];

const normalize = (value) => String(value).trim().toLowerCase();

const GOVERNORATE_MAP = new Map(
  TUNISIA_GOVERNORATES.map((name) => [normalize(name), name])
);

function toGovernorate(value) {
  return GOVERNORATE_MAP.get(normalize(value || ''));
}

module.exports = {
  TUNISIA_GOVERNORATES,
  toGovernorate,
};
