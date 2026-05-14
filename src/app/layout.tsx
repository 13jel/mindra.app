import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/Providers";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";
import { applyThemeScript } from "@/lib/applyThemeScript";
import "./global.css";

export const metadata: Metadata = {
  title: "Mindra",
  description: "Träning i din takt.",
  manifest: "/manifest.json",
  applicationName: "Mindra",
  appleWebApp: {
    capable: true,
    title: "Mindra",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#2a201c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-palette="peach"
      data-density="standard"
      data-kind="off"
      suppressHydrationWarning
    >
      <head>
        {/* Pre-hydration: apply persisted UI prefs to <html> before paint. */}
        <script dangerouslySetInnerHTML={{ __html: applyThemeScript }} />
      </head>
      <body className="bg-bg text-fg min-h-dvh antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <ThemeBootstrap />
            <main className="mx-auto w-full max-w-screen-sm pb-24">
              {children}
            </main>
            {/* BottomNav imported in Providers to keep this file slim. */}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}