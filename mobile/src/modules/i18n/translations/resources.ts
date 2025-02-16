import ca from "./ca.json";
import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import hi from "./hi.json";
import id from "./id.json";
import ja from "./ja.json";
import ru from "./ru.json";
import tr from "./tr.json";
import zhHans from "./zh-Hans.json";

export const resources = {
  ca: { translation: ca },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  hi: { translation: hi },
  id: { translation: id },
  ja: { translation: ja },
  ru: { translation: ru },
  tr: { translation: tr },
  "zh-Hans": { translation: zhHans },
} satisfies Record<string, Record<"translation", any>>;
