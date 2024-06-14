import { neatJSON } from "neatjson";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import existingLicenses from "../src/assets/licenses.json" assert { type: "json" };

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
 * @typedef {{ name: string, licenseType: string, link: string, installedVersion: string }} License
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

  const licenseReport = /** @type {License[]} */ (JSON.parse(inputStr));
  const newLicenses = /** @type {string[]} */ ([]);

  const currLicenses = licenseReport
    .map((entry) => {
      const exists = existingLicenses.find(({ name }) => name === entry.name);
      if (exists) {
        const { name, licenseType, installedVersion } = entry;
        // Make sure license hasn't changed.
        if (exists.licenseType !== licenseType) {
          styleText(
            "yellow",
            `\`${name}\` changed its license from "${exists.licenseType}" to "${licenseType}".`,
          );
        }
        return { ...exists, licenseType, installedVersion };
      }
      // New Entry
      newLicenses.push(entry.name);
      const { link: repositoryLink, ...rest } = entry;
      return { ...rest, licenseLink: null, repositoryLink };
    })
    .filter((entry) => !!entry)
    .sort((a, b) => a.name.localeCompare(b.name));

  const removedPackages = existingLicenses.filter(
    ({ name }) => !currLicenses.some((entry) => entry.name === name),
  );

  if (newLicenses.length > 0) {
    styleText(
      "green",
      `The following packages have been installed, make sure the values in \`licenses.json\` are correct, then rerun \`pnpm sync:licenses\`: ${newLicenses.map((name) => `\`${name}\``).join(", ")}.`,
    );
  }

  if (removedPackages.length > 0) {
    styleText(
      "red",
      `The following packages have been removed: ${removedPackages.map(({ name }) => `\`${name}\``).join(", ")}.`,
    );
  }

  fs.writeFileSync(
    path.resolve(projectRootPath, "./src/assets/licenses.json"),
    neatJSON(currLicenses, {
      objectPadding: 1,
      afterComma: 1,
      afterColon1: 1,
      afterColonN: 1,
    }),
  );

  /* Update `THIRD_PARTY.md` based on the new `licenses.md`. */
  const tableHeading = [
    "| Package Name | License Type & Link | Repository Link |",
    "| ------------ | ------------------- | --------------- |",
  ];
  const tableRows = currLicenses.map(
    ({ name, licenseType, licenseLink, repositoryLink }) => {
      const license = licenseLink
        ? `[${licenseType}](${licenseLink})`
        : licenseType;
      return `| ${name} | ${license} | ${repositoryLink} |`;
    },
  );

  fs.writeFileSync(
    path.resolve(projectRootPath, "./THIRD_PARTY.md"),
    [...tableHeading, ...tableRows].join("\n"),
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
