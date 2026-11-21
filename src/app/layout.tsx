import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Beacon · Family mediation, step by step", template: "%s · Beacon" },
  description:
    "Plain answers about family mediation in California, a preparation checklist you can download, and a private case workspace for Beacon clients.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f4f8fb" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
