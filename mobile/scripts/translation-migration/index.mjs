import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import NewTranslationStructure from "./newStructure.json" assert { type: "json" };
import TranslationMap from "./translationMap.json" assert { type: "json" };

/**
 * Moves the specified translation file to the new structure.
 * @param {string} source
 */
async function migrateTranslation(source) {
  // Copy over the translations from `source` to our new structure.
  //  - NOTE: The `spread` operator only does a shallow copy.
  const updatedStruc = {
    ...JSON.parse(JSON.stringify(NewTranslationStructure)),
  };
  const oldTranslations = JSON.parse(await fs.readFile(source, "utf-8"));
  traverseTranslation(oldTranslations, updatedStruc, []);
  // We'll store the created file in an `output` folder in the translations.
  const fileName = source.split("\\").at(-1);
  const output = path.resolve(source, `../../output/${fileName}`);
  console.log(`[${fileName}] Creating output at \`${output}\`.`);
  await fs.writeFile(output, JSON.stringify(updatedStruc), "utf-8");
}

/**
 * Helper to go through the original translation file recursively and move
 * its values to the new structure.
 * @param {Record<string, unknown>} srcObj
 * @param {Record<string, unknown>} newObj
 * @param {string[]} keys
 */
function traverseTranslation(srcObj, newObj, keys = []) {
  Object.keys(srcObj).forEach((key) => {
    const value = srcObj[key];
    if (typeof srcObj[key] === "object" && value !== null) {
      traverseTranslation(srcObj[key], newObj, [...keys, key]);
    } else if (value !== null) {
      // Find where we want to put the value of this key in the new structure.
      const location = findPlacement([...keys, key]);
      if (typeof location === "string") {
        // Insert this value in it's new location.
        insertInStructure(newObj, location, value);
      }
    }
  });
}

/**
 * Find the location for this value in the new structure.
 * @param {string[]} keys
 * @returns {string | null}
 */
function findPlacement(keys) {
  return keys.reduce((acc, key) => acc?.[key], TranslationMap);
}

/**
 * Insert value at location in new structure.
 * @param {Record<string, unknown>} obj
 * @param {null} location
 * @param {string} value
 */
function insertInStructure(obj, location, value) {
  const keys = location.split(".");
  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    curr = curr[keys[i]];
  }
  curr[keys.at(-1)] = value;
}

/** Move all translations to new structure. */
async function migrationTranslations() {
  // `import.meta.dirname` should resolve to `/scripts/translation-migration`.
  console.log(
    `[Translation Migration] Running From: \`${import.meta.dirname}\``,
  );

  const legacyFolder = path.resolve(
    import.meta.dirname,
    "../../src/modules/i18n/translations/_legacy",
  );
  const files = await fs.readdir(legacyFolder);

  for (const fileName of files) {
    await migrateTranslation(path.resolve(legacyFolder, fileName));
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrationTranslations();
}
