import Image from "next/image";
import { BidBoard } from "@/components/BidBoard";
import { BidProvider } from "@/components/BidProvider";
import { BrandDemo } from "@/components/BrandDemo";
import { Countdown } from "@/components/Countdown";
import { LotPhotos } from "@/components/LotPhotos";
import { CalloutStrip, Reveal, RevealHeadline } from "@/components/Motion";
import { SpotList } from "@/components/SpotList";
import { BIDDING_ENDS_AT, CAMPAIGN, SPOTS, deadlineLabel } from "@/data/spots";
import { getLiveData } from "@/lib/board";

// Bids change often; re-check at most every 30s (a placed bid revalidates immediately).
export const revalidate = 30;

// A perk is either a single line, or a heading with a list of items under it.
const PERKS: (string | { title: string; items: string[] })[] = [
  "Your brand printed on the blazer or the bag, and on me for the whole day",
  {
    title: "Content from the event:",
    items: [
      "1 announcement video",
      "1 founder interview",
      "2 short videos",
      "An Instagram travel vlog",
      "An event recap",
      "A sponsor thank-you post",
    ],
  },
  "People will ask me about your brand. I'll tell them about you",
  "The posts stay up after the event, so people keep seeing them",
];

const FAQ = [
  {
    q: "How does bidding work?",
    a: `Each spot has a starting price, and the first bid can match it. After that every bid has to double the one before it, so the price climbs fast. Bidding ends ${deadlineLabel()} at 11:59 PM Singapore time, and whoever's on top then wins.`,
  },
  {
    q: "Someone bid on both spots. What happens to my blazer bid?",
    a: "At the end I add up the top blazer bid and the top bag bid. If the bid for both is higher than that, it takes both spots. If not, you and the top bag bidder each get your spot.",
  },
  {
    q: "Do I pay when I bid?",
    a: `Nope, there's no payment on the site. If you win, I'll DM you after ${deadlineLabel()} and we'll sort it out. Bank transfer or USDC, whichever's easier for you.`,
  },
  {
    q: "What kind of logo file do you need?",
    a: "Send an SVG, AI or PDF if you have one. A big transparent PNG works too, and I'll send you a mockup to approve before anything gets made. These are proper custom pieces, not cheap prints: good materials, handmade detailing, and your logo done as embroidery, patches, custom lettering, your brand colours, metallic or 3D bits, even a slogan if you want one.",
  },
  {
    q: "Can I keep the blazer afterwards?",
    a: "Yes. Keep it as a one-off piece, wear it to your own events, or give it to someone.",
  },
  {
    q: "What if the event doesn't happen?",
    a: "Then you get your money back. Same if I can't make it for some reason.",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
      {children}
    </p>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-sm bg-highlight/70 px-1.5 font-semibold text-fg">
      {children}
    </span>
  );
}

export default async function Home() {
  const live = await getLiveData();
  const { board } = live;
  const totalBids = SPOTS.reduce((n, s) => n + board[s.id].bidCount, 0);
  const deadline = new Date(BIDDING_ENDS_AT).toLocaleString("en-US", {
    timeZone: "Asia/Singapore",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <BidProvider initial={live}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <span className="relative h-8 w-8 overflow-hidden rounded-full bg-chip">
              <Image
                src="/looks/outfit.webp"
                alt=""
                fill
                sizes="32px"
                className="origin-[50%_14%] scale-[2.2] object-cover object-[50%_12%]"
              />
            </span>
            <span className="font-mono text-lg font-bold">jigyasa</span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <a
              href="#board"
              className="hidden transition hover:text-accent md:inline"
            >
              Live bids
            </a>
            <a
              href="#how"
              className="hidden transition hover:text-accent md:inline"
            >
              How it works
            </a>
            <a
              href="#about"
              className="hidden transition hover:text-accent md:inline"
            >
              About me
            </a>
            <a
              href="#spots"
              className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-deep active:scale-[0.97]"
            >
              Place a bid
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-4 pt-8 text-center sm:px-6 sm:pt-12">
          <p className="text-sm text-muted">
            <span className="pulse-dot mr-2 inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold text-fg">{totalBids}</span>{" "}
            {totalBids === 1 ? "bid" : "bids"} so far, closes in{" "}
            <span className="font-semibold text-fg">
              <Countdown endsAt={BIDDING_ENDS_AT} compact />
            </span>
          </p>
          <RevealHeadline
            text={CAMPAIGN.headline}
            accent={CAMPAIGN.headlineAccent.split(" ")}
            className="mx-auto mt-4 max-w-3xl text-balance font-display text-5xl leading-[1.02] tracking-[-0.01em] sm:text-7xl"
          />
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted sm:text-xl">
            I&apos;m going to TOKEN2049 in Singapore and there&apos;s room on me
            for <Highlight>two brands</Highlight>. Highest bid wins.
          </p>

          <div className="mt-10">
            <LotPhotos />
          </div>
        </section>

        {/* Callout strip */}
        <CalloutStrip
          title={CAMPAIGN.tagline[0].toUpperCase()}
          sub={CAMPAIGN.tagline[1].toUpperCase()}
        />

        {/* Spots / bidding */}
        <section
          id="spots"
          className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel>The spots</SectionLabel>
              <h2 className="mt-2 font-display text-5xl tracking-[-0.01em]">
                What&apos;s up for <em>grabs</em>
              </h2>
              <p className="mt-2 max-w-md text-muted">
                One brand on the blazer, one on the bag. Or take both and have
                the whole outfit to yourself.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="mb-2 text-sm text-muted">
                Bidding closes {deadline} SGT
              </p>
              <Countdown endsAt={BIDDING_ENDS_AT} />
            </div>
          </div>

          <div className="mt-8">
            <SpotList />
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            <span className="font-semibold text-fg">
              If someone bids on both:
            </span>{" "}
            at the end I add up the top blazer bid and the top bag bid. If the
            bid for both beats that, it wins both spots. If not, the two
            separate bids win.
          </p>
        </section>

        {/* Bid board */}
        <section id="board" className="border-t border-line">
          <Reveal className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
            <SectionLabel>Live bids</SectionLabel>
            <h2 className="mt-2 font-display text-5xl tracking-[-0.01em]">
              Who&apos;s bidding <em>right now</em>
            </h2>
            <p className="mt-2 max-w-lg text-muted">
              Every bid shows up here. Want your brand name on it? Tick the box
              when you bid. Otherwise you show up as anonymous.
            </p>
            <div className="mt-8">
              <BidBoard />
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-line">
          <Reveal className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-2 font-display text-5xl tracking-[-0.01em]">
              Pretty simple, <em>really</em>
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
              Pick the blazer, the bag, or both, and put in a bid. Anyone can
              outbid you until {deadlineLabel()}, so keep an eye on the board.
              Whoever&apos;s on top at the end wins. I&apos;ll get in touch, you
              send me your brand files, I get them printed, and then I wear your
              brand around TOKEN2049 all day.
            </p>
            <div className="mt-8">
              <BrandDemo />
            </div>
          </Reveal>
        </section>

        {/* The event */}
        <section className="border-t border-line">
          <Reveal className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
            <SectionLabel>The event</SectionLabel>
            <h2 className="mt-2 font-display text-5xl tracking-[-0.01em]">
              Why <em>TOKEN2049</em>
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
              It&apos;s one of the biggest crypto events of the year. Founders,
              funds, builders, basically everyone shows up at {CAMPAIGN.venue}{" "}
              in October. A booth there costs five figures. This costs a lot
              less, and I&apos;ll actually be walking around talking to people
              all day.
            </p>
          </Reveal>
        </section>

        {/* Perks */}
        <section id="perks" className="border-t border-line">
          <Reveal className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
            <SectionLabel>What you get</SectionLabel>
            <h2 className="mt-2 font-display text-5xl tracking-[-0.01em]">
              What&apos;s in it <em>for you</em>
            </h2>
            <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
              {PERKS.map((p) => (
                <li
                  key={typeof p === "string" ? p : p.title}
                  className="flex gap-3 px-5 py-4"
                >
                  <span className="font-bold text-money">✓</span>
                  {typeof p === "string" ? (
                    <span>{p}</span>
                  ) : (
                    <details className="group flex-1">
                      <summary className="flex cursor-pointer list-none items-center gap-2">
                        {p.title}
                        <span className="font-mono text-xs text-muted">
                          {p.items.length} things
                        </span>
                        <span className="text-lg leading-none text-accent transition group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted marker:text-highlight">
                        {p.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* About */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div
            id="about"
            className="scroll-mt-24 rounded-lg border border-line bg-surface p-6 sm:p-8"
          >
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
              <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-chip">
                <Image
                  src="/looks/outfit.webp"
                  alt="Jigyasa"
                  fill
                  sizes="72px"
                  className="origin-[50%_14%] scale-[2.2] object-cover object-[50%_12%]"
                />
              </span>
              <div>
                <p className="font-display text-4xl leading-none">
                  Hi, I&apos;m Jigyasa
                </p>
                <p className="mt-3 text-muted">
                  I make videos, mostly about web3, and I&apos;ve done content
                  for Base, Bybit, Huddle01, Fhenix, Stellar and a few others.
                </p>
                <p className="mt-2 text-muted">
                  Booths at TOKEN2049 cost a ton, and most people walk right
                  past them. Nobody walks past me in a blazer with a giant logo
                  on it. So I figured, why not let a brand have that.
                </p>
                <p className="mt-2 text-muted">
                  The money goes into printing, content and a full day at{" "}
                  {CAMPAIGN.venue} with your brand on me. If the event gets
                  cancelled or I can&apos;t go, you get your money back.
                </p>
                <p className="mt-3 text-sm font-semibold">
                  <a
                    href={CAMPAIGN.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {CAMPAIGN.handle}
                  </a>
                </p>
                <p className="mt-1 text-sm font-semibold">
                  more about me:{" "}
                  <a
                    href={CAMPAIGN.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {CAMPAIGN.portfolioLabel}
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-6 sm:mt-8 sm:pt-8">
              <h3 className="font-display text-3xl leading-none sm:text-4xl">
                How this started
              </h3>
              <div className="mt-4 max-w-3xl space-y-3 text-muted">
                <p>
                  As a model I can&apos;t represent a bunch of brands at once.
                  Designers pay for exclusivity, so when I wear a collection,
                  that&apos;s the only thing I&apos;m representing. It got me
                  thinking: why should an outfit carry 20 logos when it could
                  carry one or two and actually mean something?
                </p>
                <p>
                  Then I went to a crypto conference. Four days, more than 7,000
                  projects, and by the end nobody could remember who they&apos;d
                  met. So I decided to make something people can&apos;t walk
                  past: a custom blazer and a statement bag built for two
                  brands, not twenty.
                </p>
                <p>
                  I&apos;m not after the usual promotion. I want the kind of
                  thing people spot across the street, come over for a closer
                  look, and ask about. I&apos;ve spent years walking ramps. This
                  time I&apos;m walking the streets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-line">
          <Reveal className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-2 font-display text-5xl tracking-[-0.01em]">
              Stuff people <em>ask</em>
            </h2>
            <div className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {f.q}
                    <span className="text-xl leading-none text-accent transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              Still got questions? My DMs are open:{" "}
              <a
                href={CAMPAIGN.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {CAMPAIGN.handle}
              </a>
            </p>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-mono">jigyasa at {CAMPAIGN.event}</span>
          <div className="flex gap-5">
            <a
              href={CAMPAIGN.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              Portfolio
            </a>
            <a
              href={CAMPAIGN.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              X
            </a>
            <a
              href={CAMPAIGN.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              Instagram
            </a>
            <a
              href={CAMPAIGN.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              YouTube
            </a>
          </div>
        </div>
      </footer>
    </BidProvider>
  );
}
