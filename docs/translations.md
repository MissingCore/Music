# Translations

**Translations are created by community members who use the app and want to support their language.**

We use the following packages to display these translations:

- [`i18next`](https://www.i18next.com/) which deals with language switching.
- [`expo-localization`](https://docs.expo.dev/versions/latest/sdk/localization/) to get your device's current language and set an initial localization.

## File Structure

All translations live in the [`mobile/src/modules/i18n/translations`](https://github.com/MissingCore/Music/tree/main/mobile/src/modules/i18n/translations) directory, with the filenames being `<language-code>.json`. Inside, there will be a `language` field, in which you will populate it with the name of the language in that given language (ie: English would have `"language": "English"` and Japanese would have `"language": "日本語"`).

`i18next` provides some special features such as handling interpolation (mixing untranslated text with translated text) and plurals.

- **Interpolation** may look like `{{- name}}` or `{{name}}` (`name` can be any string) in a given translation string. You can reposition this "phrase" within the translation string that best suits the language flow.
- **Plurals** are handled by translation keys with a `_one` & `_other` suffix and can optionally have a `{{count}}` (must be `{{count}}`) interpolation key.

You may also see some instances of **nesting**, which is where we use a translated value defined earlier in this given translation string. It'll appear in the translation string as `$t(<some-key>)`.

> [!CAUTION]  
> **DO NOT** translate the key used for interpolation or nesting.

One important notation that you should remember is that a `null` value in the translation means that the key has no associated translated value. This means that where that key will be used, it will use the fallback language, which is English.

- One good thing about this is that you can easily see which keys are missing translations.

## How To Contribute

There are currently 2 ways to contribute translations:

1. Through the Crowdin project at: https://crowdin.com/project/missingcore-music.
2. Manually through a Pull Request.

### Contribution Through Crowdin

This will require you to make a Crowdin account in order to suggest translations.

- With the current settings, you (hopefully) don't need approval to join the project.
- You should receive notifications whenever we add new strings.

> **Note:** You might need to message me on Crowdin to get permission to be a translator.

If the language you want to translation isn't available in the project, request it on Crowdin or create a GitHub issue using the `🔠 Crowdin/Translation` template.

### Contribution Through Pull Request

> [!IMPORTANT]  
> You should make these changes against the translations on the `main` branch and create a PR that merges into the `main` branch.

1. Create a new file called `<your-language-code>.json` in `mobile/src/modules/i18n/translations`. A list of language codes can be found [here](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes).
2. Copy the contents of `en.json` into this file.
3. Change the value of the `language` key to the name of the language in the language.
4. Add your translations.
   - You can use similar words if they don't get translated well in your language (ie: use the translation of "song" instead of "track").
   - If you're unsure of a translation for the given key, leave `null` (no quotes) in that field.
   - Move any interpolation (ie: `{{name}}`) to where they make sense in the flow of the language.
5. After you finish creating your translations, [create a pull request](https://github.com/MissingCore/Music/pulls).
   - When you create your pull request, I'll manually add the logic to "enable" selection of this translation.

> One downside is that you won't automatically be notified when new strings are added, though with the Crowdin GitHub Actions, you should be able to see which keys require translations.

## Attribution/Credits

If you contributed a translation through a Pull Request, you will be credited with the Git commit.

Changes through Crowdin are harder to credit as they don't expose the email of the translator (for privacy reasons), which could have been used to attribute the user in Git. For this reason, we introduced a [`TRANSLATORS.md`](../TRANSLATORS.md) file listing out translators based on the "Activity" report on Crowdin.
