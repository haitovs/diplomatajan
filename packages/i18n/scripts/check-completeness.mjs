import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, 'packages', 'i18n', 'locales');
const SOURCE_LOCALE = 'en-US';
const REQUIRED_LOCALE = 'tk-TM';

const flatten = (input, prefix = '') => {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return [prefix];
  }

  return Object.entries(input).flatMap(([key, value]) =>
    flatten(value, prefix ? `${prefix}.${key}` : key),
  );
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const sourceDir = path.join(LOCALES_ROOT, SOURCE_LOCALE);
const requiredDir = path.join(LOCALES_ROOT, REQUIRED_LOCALE);

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.json'));
let hasError = false;

for (const file of files) {
  const sourceFile = path.join(sourceDir, file);
  const requiredFile = path.join(requiredDir, file);

  if (!fs.existsSync(requiredFile)) {
    console.error(`[i18n] Missing locale file: ${REQUIRED_LOCALE}/${file}`);
    hasError = true;
    continue;
  }

  const sourceKeys = new Set(flatten(readJson(sourceFile)));
  const requiredKeys = new Set(flatten(readJson(requiredFile)));

  const missing = [...sourceKeys].filter((key) => !requiredKeys.has(key));
  const extra = [...requiredKeys].filter((key) => !sourceKeys.has(key));

  if (missing.length) {
    console.error(`[i18n] Missing keys in ${REQUIRED_LOCALE}/${file}`);
    missing.forEach((key) => console.error(`  - ${key}`));
    hasError = true;
  }

  if (extra.length) {
    console.warn(`[i18n] Extra keys in ${REQUIRED_LOCALE}/${file}`);
    extra.forEach((key) => console.warn(`  - ${key}`));
  }
}

if (hasError) {
  process.exit(1);
}

console.log('[i18n] Locale completeness check passed.');
