# Translations

Translations are created by community members who use the app and want to support their language.

We use the following packages to display these translations:

- [`i18next`](https://www.i18next.com/) which deals with language switching.
- [`expo-localization`](https://docs.expo.dev/versions/latest/sdk/localization/) to get your device's current language and set an initial localization.

## File Structure

All translations live in the [`mobile/src/modules/i18n/translations`](https://github.com/MissingCore/Music/tree/dev/mobile/src/modules/i18n/translations) directory, with the filenames being `<language-code>.json`. Inside, there will be a `language` field, in which you will populate it with the name of the language in that given language (ie: English would have `"language": "English"` and Japanese would have `"language": "日本語"`).

`i18next` provides some special features such as handling interpolation (mixing untranslated text with translated text) and plurals.

- **Interpolation** may look like `{{- name}}` or `{{name}}` (`name` can be any variable name) in a given translation string. You can reposition this "phrase" within the translation string that best suits the language flow.
- **Plurals** are handled by translation keys with a `_one` & `_other` suffix and can optionally have a `{{count}}` (must be `{{count}}`) interpolation key.

You may also see some instances of **nesting**, which is where we use a translated value defined earlier in this given translation string. It'll appear in the translation string as `$t(<some-key>)`.

### Brief Explanation on Organization

- `common` contains terms used throughout the app.
- `header` contains page names that are prominently displayed or are in the header.
- `title` contains the header names used in modals.
- `plural` contain phrases involving a dynamic number we provide.
- `response` contains any message we conditionally display to the user.

## How To Contribute

> [!IMPORTANT]  
> Do note that the contents and structure of `en.json` may change over time as we add or remove translations.

1. Create a new file called `<your-language-code>.json` in `mobile/src/modules/i18n/translations`. A list of language codes can be found [here](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes).
2. Copy the contents of `en.json` into this file.
3. Change the value of the `language` key to the name of your language in your language.
4. After you finish creating your translations, [create a pull request](https://github.com/MissingCore/Music/pulls).
