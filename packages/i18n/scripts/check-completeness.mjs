import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, 'packages', 'i18n', 'locales');
const SOURCE_LOCALE = 'en-US';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const sourceDir = path.join(LOCALES_ROOT, SOURCE_LOCALE);
if (!fs.existsSync(sourceDir)) {
  console.error(`[i18n] Missing source locale directory: ${SOURCE_LOCALE}`);
  process.exit(1);
}

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.json'));
let hasError = false;

if (files.length === 0) {
  console.error(`[i18n] Source locale "${SOURCE_LOCALE}" has no JSON files.`);
  process.exit(1);
}

for (const file of files) {
  const sourceFile = path.join(sourceDir, file);

  try {
    readJson(sourceFile);
  } catch (error) {
    console.error(`[i18n] Invalid JSON in ${SOURCE_LOCALE}/${file}`);
    console.error(error instanceof Error ? error.message : String(error));
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log('[i18n] English source locale check passed.');
