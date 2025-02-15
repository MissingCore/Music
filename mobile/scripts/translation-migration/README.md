# (Legacy) Translation Migration Script

This is a simple script to convert translations from `~/modules/i18n/translations/_legacy/[lang].json` to the new revised structure and put it in `~/modules/i18n/translations/output/[lang].json`. This way, we don't go insane verifying that we copied the translations over manually correctly.

- `newStructure.json`: A representation of the new translation structure.
- `translationMap.json`: A map of where each translation value belongs to in the new structure.
  - `null` represents translations that may not be used or may require adjustments.

## Running the Script

1. Ensure that an `output` folder exists in `~/modules/i18n/translations`.
2. Run the following command while you're in the `mobile` directory:

   ```sh
   node scripts/translation-migration/index.mjs
   ```

## Output Adjustments

By default, the outputted JSON will be compressed into a single line, which makes it hard to read. We could make it look nice by using the `neatjson` package, but that's an unnecessary dependency.

Since we use Prettier, we can run the format shortcut to format the file into something more readable. Since we also like visually distinguishing groups of content from one another, we can add the spaces and break up the JSON objects over multiple lines (referencing the [`newStructure.json` file](./newStructure.json)).

### Translation Adjustments

Besides making the JSON file look nice, there are some translations that we haven't automatically brought over due to some changes that need to be made to make it work in the new structure or just changes in general.

- `settings.description.homeTabsOrder`: The description is broken into 2 new keys:
  - `feat.homeTabsOrder.description.line1`
  - `feat.homeTabsOrder.description.line2`
- `settings.related.pathAdd`: Changed from `"Add directory."` to `"Add Directory"`.
  - Goes to `feat.directory.extra.add`.
- `settings.related.pathSelect`: Changed from `"Select directory."` to `"Select Directory"`
  - Goes to `feat.directory.extra.select`.
- `template.showEntry`: Changed from `"Show {{- name}}"` to `"Show {{item}}"`.
  - Goes to `template.itemShow`.
- `template.hideEntry`: Changed from `"Hide {{- name}}"` to `"Hide {{item}}"`.
  - Goes to `template.itemHide`.
- `plural.track_one`: Changed from `"{{count}} $t(common.track)"` to `"{{count}} $t(term.track)"`.
  - Goes to `plural.track_one`.
- `plural.track_other`: Changed from `"{{count}} $t(common.tracks)"` to `"{{count}} $t(term.tracks)"`.
  - Goes to `plural.track_other`.
