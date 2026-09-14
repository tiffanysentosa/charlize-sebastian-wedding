import type { Metadata, Viewport } from "next";
import { EB_Garamond, Monsieur_La_Doulaise, Playfair_Display_SC } from "next/font/google";
import "./globals.css";

const serif = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const display = Playfair_Display_SC({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const script = Monsieur_La_Doulaise({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Sebastian & Charlize · Bali 2027",
  description: "The wedding of Sebastian Suherman and Charlize Sentosa in Nusa Dua, Bali.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2eee7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${display.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
