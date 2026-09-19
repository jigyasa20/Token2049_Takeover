import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { CAMPAIGN, deadlineLabel, taglineText } from "@/data/spots";
import "./globals.css";

// Headings: editorial serif. Body: Satoshi (Fontshare, ITF Free Font License, self-hosted).
// Numbers, bids and labels: JetBrains Mono.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const satoshi = localFont({
  variable: "--font-satoshi",
  src: "./fonts/Satoshi-Variable.woff2",
  weight: "300 900",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Built from the shared settings in src/data/spots.ts, like the share banner.
const title = `Put your brand on me at TOKEN2049 | ${CAMPAIGN.name}`;
const description = `${taglineText()} Bid to put your brand on my blazer, my bag, or both at ${CAMPAIGN.event}. Bidding closes ${deadlineLabel()}.`;

// The share banner (opengraph-image.tsx / twitter-image.tsx) and the tab icons (icon.png,
// apple-icon.png, favicon.ico) live in this folder and are picked up automatically.
// Share images need the site's full address: on Vercel that's filled in for us; on any
// other host, set SITE_URL (e.g. https://example.com).
export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "Jigyasa at TOKEN2049",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: CAMPAIGN.handle,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${satoshi.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
