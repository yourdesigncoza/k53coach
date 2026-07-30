import { Poppins, Inter } from "next/font/google";

/**
 * The "winning combination" brand pair: Poppins for display/headings, Inter for
 * body copy. Shared because there is more than one document root — the locale
 * root layout AND `app/not-found.tsx` (which renders its own <html> since the
 * root layout lives under the [locale] segment). Both must load the same faces
 * or the 404 falls back to system fonts.
 */
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

/** Class list to put on <html> so `font-sans` / `font-display` resolve. */
export const fontVariables = `${inter.variable} ${poppins.variable}`;
