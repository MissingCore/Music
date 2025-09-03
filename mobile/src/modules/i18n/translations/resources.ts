import ar from "./ar.json";
import ca from "./ca.json";
import da from "./da.json";
import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import hi from "./hi.json";
import id from "./id.json";
import it from "./it.json";
import ja from "./ja.json";
import pl from "./pl.json";
import ru from "./ru.json";
import tr from "./tr.json";
import zhHans from "./zh-Hans.json";

export const resources = {
  ar: { translation: ar },
  ca: { translation: ca },
  da: { translation: da },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  hi: { translation: hi },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  pl: { translation: pl },
  ru: { translation: ru },
  tr: { translation: tr },
  "zh-Hans": { translation: zhHans },
} satisfies Record<string, Record<"translation", any>>;
