import { neatJSON } from "neatjson";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import nonNPMLicenses from "./nonNPMLicenses.json" assert { type: "json" };

const ConsoleColor = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

/**
 * Logs text into the console in a specific color.
 *
 * @param {Exclude<keyof typeof ConsoleColor, "reset">} color
 * @param {string} text
 */
function styleText(color, text) {
  return console.log(ConsoleColor[color], text, ConsoleColor.reset);
}

/**
 * @typedef {{ name: string, version: string, copyright: string, repository: string, licenses: string, licenseText: string }} License
 */

let inputStr = "";

/**
 * Make sure `installedVersion` is correct for each package when we update.
 * In addition, we add a new entry if a new package was installed.
 *
 * This keeps `licenses.json` & `THIRD_PARTY.md` synchronized with the
 * installed packages.
 */
function updateLicensesJSON() {
  const projectRootPath = process.cwd();

  /** @type {Record<string, License>} */
  const licenseReport = JSON.parse(inputStr);

  const updatedLicenseList = Object.fromEntries(
    Object.values(licenseReport)
      .map(
        ({ name, version, copyright, repository, licenses, licenseText }) => {
          const content = {
            ...{ name, version, copyright: copyright || null },
            ...{ source: repository, license: licenses, licenseText },
          };
          return [name, content];
        },
      )
      .concat(
        Object.entries(nonNPMLicenses).map(([key, value]) => [key, value]),
      )
      .sort((a, b) => a[1].name.localeCompare(b[1].name)),
  );

  fs.writeFileSync(
    path.resolve(projectRootPath, "./src/assets/licenses.json"),
    neatJSON(updatedLicenseList, {
      objectPadding: 1,
      afterComma: 1,
      afterColon1: 1,
      afterColonN: 1,
    }),
  );

  /* Update `THIRD_PARTY.md` based on the new `licenses.md`. */
  const tableHeading = [
    "| Name | License | Source |",
    "| ---- | ------- | ------ |",
  ];
  const tableRows = Object.values(updatedLicenseList).map(
    ({ name, license, source }) => `| ${name} | ${license} | ${source} |`,
  );

  fs.writeFileSync(
    path.resolve(projectRootPath, "./THIRD_PARTY.md"),
    [...tableHeading, ...tableRows].join("\n"),
  );

  styleText(
    "green",
    "Remember to review `licenses.json` & update `licenseClarification.json` as needed.",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Initialize reading from stream.
  process.stdin.resume();
  // Read stream as string.
  process.stdin.setEncoding("utf-8");

  // Listen for data emitted by `license-report` (should be a single line).
  process.stdin.on("data", (inputStream) => {
    inputStr += inputStream;
  });
  // Fired when no more data is emitted.
  process.stdin.on("end", () => {
    inputStr = inputStr.trim();
    updateLicensesJSON();
  });
}
