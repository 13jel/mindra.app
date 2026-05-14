import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locale";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "Europe/Stockholm",
  };
});