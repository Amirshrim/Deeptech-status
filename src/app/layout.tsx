import type { Metadata, Viewport } from "next";
import { Assistant, IBM_Plex_Mono, Open_Sans } from "next/font/google";
import "./globals.css";

// Fonts are self-hosted by next/font at build time — no requests to Google from
// members' browsers for text fonts.
const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-assistant",
  display: "swap",
});
const openSans = Open_Sans({
  subsets: ["hebrew", "latin"],
  variable: "--font-open-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deep-Tech Reichman — תזונה ומשוב",
  description: "העדפות תזונה ומשוב על מפגשים — מועדון הדיפ-טק של אוניברסיטת רייכמן",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d081f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${assistant.variable} ${openSans.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Material Symbols (icon font). display=block avoids flashing ligature text. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
