/**
 * Keyword matching for ATS scoring.
 * Matches whole words/phrases after normalization (no substring hits like "sql" in "postgresql"),
 * with a small synonym table for common Indonesian/English and abbreviation variants.
 */

// Canonical form ← variants (all compared after normalize())
const SYNONYMS = {
  'food and beverage': ['f and b', 'fnb', 'f b'],
  'node.js': ['nodejs', 'node js', 'node'],
  'react': ['react.js', 'reactjs'],
  'next.js': ['nextjs', 'next js'],
  'excel': ['microsoft excel', 'ms excel', 'google sheets'],
  'management': ['manajemen', 'pengelolaan'],
  'customer service': ['pelayanan pelanggan', 'layanan pelanggan'],
  'social media': ['media sosial', 'sosmed'],
  'tax': ['pajak', 'perpajakan', 'taxation'],
  'accounting': ['akuntansi'],
  'compliance': ['kepatuhan'],
  'labor law': ['uu ketenagakerjaan', 'hukum ketenagakerjaan', 'ketenagakerjaan'],
  'leadership': ['kepemimpinan'],
  'inventory management': ['stock management', 'manajemen stok', 'inventory'],
  'p and l': ['p and l analysis', 'profit and loss', 'laba rugi'],
  'sales': ['penjualan'],
  'b2b sales': ['b2b'],
  'video editing': ['edit video', 'editing video'],
  'storyboarding': ['storyboard'],
  'copywriting': ['copywriter'],
  'public speaking': ['berbicara di depan umum'],
  'networking': ['jaringan komputer']
};

const STOPWORDS = new Set(['and', 'dan', 'the', 'of', 'for', 'untuk', 'di', 'in', 'with']);

// Words that describe *how* rather than *what* — dropped for a partial match ("Team Leadership" ≈ "Leadership")
const GENERIC = new Set(['management', 'manajemen', 'team', 'operations', 'operation', 'skills', 'skill', 'strategy', 'system', 'systems', 'analysis', 'planning', 'specialist', 'services', 'general']);

/** Match strength: 1 = full keyword found, 0.75 = core found without generic words, 0 = absent */
const FULL = 1;
const PARTIAL = 0.75;

/** Lowercase, unify "&" and punctuation, keep tech tokens like node.js / c# / ci/cd intact */
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9.+#/\s-]/g, ' ')
    .replace(/(^|\s)[.\-/]+|[.\-/]+(?=\s|$)/g, ' ') // strip punctuation at word edges, keep "node.js"
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VARIANT_TO_CANONICAL = new Map();
for (const [canonical, variants] of Object.entries(SYNONYMS)) {
  VARIANT_TO_CANONICAL.set(normalize(canonical), normalize(canonical));
  variants.forEach((v) => VARIANT_TO_CANONICAL.set(normalize(v), normalize(canonical)));
}

/** All surface forms that should count as the same keyword */
function formsOf(keyword) {
  const n = normalize(keyword);
  const forms = new Set([n]);
  const canonical = VARIANT_TO_CANONICAL.get(n);
  if (canonical) {
    forms.add(canonical);
    for (const [variant, c] of VARIANT_TO_CANONICAL) if (c === canonical) forms.add(variant);
  }
  // Phrase-level synonyms inside multi-word keywords, e.g. "F&B Management" → "food and beverage management"
  for (const [variant, c] of VARIANT_TO_CANONICAL) {
    const re = new RegExp(`(^|\\s)${escapeRe(variant)}(?=\\s|$)`);
    if (variant !== n && re.test(n)) forms.add(n.replace(re, `$1${c}`));
  }
  return [...forms];
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsPhrase(text, phrase) {
  if (!phrase) return false;
  return new RegExp(`(^|\\s)${escapeRe(phrase)}(?=\\s|$)`).test(text);
}

/** Significant tokens of a phrase (used for the "all words present" fallback) */
const tokens = (phrase) => phrase.split(' ').filter((t) => t.length > 1 && !STOPWORDS.has(t));

/**
 * Build a matcher over a candidate's skills and free text.
 * @param {string[]} skills  candidate skill names
 * @param {string}   text    headline + summary + experience descriptions
 */
function createMatcher(skills, text) {
  const normSkills = skills.map(normalize).filter(Boolean);
  const normText = ` ${normalize(text)} `;
  const haystack = ` ${normSkills.join(' | ')} ${normText} `;
  // Split before normalizing (normalize() strips the separators); ". " ends a sentence, "node.js" does not
  const sentences = String(text || '').split(/[\n•·;|]+|\.\s+/).map(normalize).filter(Boolean);

  const phraseHit = (f) => normSkills.includes(f) || containsPhrase(haystack, f);
  const allWordsInOneChunk = (f) => {
    const t = tokens(f);
    if (t.length < 2) return false;
    const has = (chunk) =>
      t.every((w) => containsPhrase(` ${chunk} `, w) || [...VARIANT_TO_CANONICAL].some(([v, c]) => c === w && containsPhrase(` ${chunk} `, v)));
    return normSkills.some(has) || sentences.some(has);
  };

  /** @returns {number} FULL, PARTIAL or 0 */
  return function strength(keyword) {
    const forms = formsOf(keyword);
    // 1. exact skill or whole-phrase hit; 2. all significant words together in one skill / sentence
    if (forms.some(phraseHit) || forms.some(allWordsInOneChunk)) return FULL;
    // 3. partial: the keyword's core without generic words ("F&B Management" → "f and b")
    const cores = forms
      // only drop generic words — keep "and" so "p and l management" → "p and l"
      .map((f) => f.split(' ').filter((w) => !GENERIC.has(w)).join(' ').trim())
      .filter((c, i) => c && c !== forms[i]);
    const coreForms = [...new Set(cores.flatMap((c) => [c, ...formsOf(c)]))];
    return coreForms.some(phraseHit) ? PARTIAL : 0;
  };
}

module.exports = { normalize, formsOf, createMatcher, FULL, PARTIAL };
