import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CAMPAIGN, HERO_PHOTOS, deadlineLabel } from "@/data/spots";

// Link-preview banner (also used for X via twitter-image.tsx). Built at deploy time from
// the shared settings in src/data/spots.ts, so changing the headline, tagline or deadline
// there updates this image too. Only PNG/JPEG images and TTF/OTF fonts work here, hence
// the copies in src/og/.

export const alt = `${CAMPAIGN.name} in a black blazer carrying a big white bag, with "your brand" spots marked. ${CAMPAIGN.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0a0a";
const PAPER = "#f5f4f2";
const MUTED = "#6b6966";

const asset = (file: string) => readFile(join(process.cwd(), "src/og", file));

// The same photo and "your brand" boxes as the third hero photo on the page.
const HERO = HERO_PHOTOS.find((p) => p.src === "/looks/blazer-bag-plain.webp")!;
const PHOTO_H = 600;
const PHOTO_W = Math.round((HERO.width / HERO.height) * PHOTO_H);

export default async function Image() {
  const [serif, serifItalic, satoshi, satoshiBold, photo] = await Promise.all([
    asset("InstrumentSerif-Regular.ttf"),
    asset("InstrumentSerif-Italic.ttf"),
    asset("Satoshi-Medium.otf"),
    asset("Satoshi-Bold.otf"),
    asset("blazer-bag.png"),
  ]);
  const photoSrc = `data:image/png;base64,${photo.toString("base64")}`;
  const accent = new Set(CAMPAIGN.headlineAccent.split(" "));
  const taglineLines = CAMPAIGN.tagline.map((l) => l.replace(/\n/g, " "));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, position: "relative" }}>
        {/* left: text */}
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 0 0 72px", width: 700 }}>
          <div style={{ display: "flex", whiteSpace: "nowrap", fontFamily: "Satoshi", fontWeight: 700, fontSize: 18, letterSpacing: 2.5, color: MUTED }}>
            {`${CAMPAIGN.event.toUpperCase()}  /  BIDDING CLOSES ${deadlineLabel().toUpperCase()}`}
          </div>

          {/* headline: one span per word so the accent word can be italic and lines wrap */}
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 24, fontSize: 84, lineHeight: 1.05, color: INK }}>
            {CAMPAIGN.headline.split(" ").map((word, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "Instrument Serif",
                  fontStyle: accent.has(word) ? "italic" : "normal",
                  marginRight: 20,
                }}
              >
                {word}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontFamily: "Satoshi", fontSize: 25, color: MUTED }}>
            {taglineLines.map((line) => (
              <span key={line} style={{ marginTop: 4 }}>
                {line}
              </span>
            ))}
          </div>
        </div>

        {/* bottom-left: name */}
        <div style={{ position: "absolute", left: 72, bottom: 40, display: "flex", flexDirection: "column" }}>
          <div style={{ width: 56, height: 2, background: INK, marginBottom: 14 }} />
          <div style={{ display: "flex", fontFamily: "Satoshi", fontWeight: 700, fontSize: 26, color: INK }}>
            {CAMPAIGN.name.toLowerCase()}
          </div>
        </div>

        {/* right: photo with the "your brand" boxes */}
        <div style={{ position: "absolute", right: 48, bottom: 0, width: PHOTO_W, height: PHOTO_H, display: "flex" }}>
          <img src={photoSrc} width={PHOTO_W} height={PHOTO_H} alt="" />
          {HERO.boxes.map((b) => (
            <div
              key={b.spot}
              style={{
                position: "absolute",
                left: (b.x / 100) * PHOTO_W,
                top: (b.y / 100) * PHOTO_H,
                width: (b.w / 100) * PHOTO_W,
                height: (b.h / 100) * PHOTO_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px dashed white",
                borderRadius: 6,
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  whiteSpace: "nowrap",
                  background: "white",
                  color: INK,
                  borderRadius: 4,
                  padding: "3px 5px",
                  fontFamily: "Satoshi",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 0.8,
                }}
              >
                YOUR BRAND
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Instrument Serif", data: serifItalic, style: "italic", weight: 400 },
        { name: "Satoshi", data: satoshi, style: "normal", weight: 500 },
        { name: "Satoshi", data: satoshiBold, style: "normal", weight: 700 },
      ],
    },
  );
}
