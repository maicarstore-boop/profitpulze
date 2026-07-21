import Link from "next/link";
import { FiTrendingUp, FiTwitter, FiGithub, FiMessageCircle } from "react-icons/fi";

const FOOTER_COLUMNS = [
  {
    title: "Products",
    links: [
      { label: "Spot Trading", href: "/markets" },
      { label: "Margin Trading", href: "/margin" },
      { label: "Futures", href: "/futures" },
      { label: "Convert", href: "/convert" },
      { label: "Staking", href: "/staking" },
      { label: "Launchpad", href: "/launchpad" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Buy Crypto", href: "/buy-crypto" },
      { label: "P2P Trading", href: "/p2p" },
      { label: "NFT Marketplace", href: "/nft" },
      { label: "Copy Trading", href: "/copy-trading" },
      { label: "Referral Program", href: "/referral" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Fees", href: "/fees" },
      { label: "API Documentation", href: "/api-docs" },
      { label: "Contact Us", href: "/contact" },
      { label: "Submit a Ticket", href: "/submit-ticket" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Announcements", href: "/announcements" },
      { label: "Legal & Privacy", href: "/legal" },
      { label: "Security", href: "/security" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FiTrendingUp className="h-4.5 w-4.5" />
              </span>
              ProfitPulze
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A next-generation cryptocurrency exchange for spot, margin, and futures
              trading — built for speed, security, and scale.
            </p>
            <div className="mt-4 flex gap-3 text-muted-foreground">
              <FiTwitter className="h-5 w-5 hover:text-foreground" />
              <FiGithub className="h-5 w-5 hover:text-foreground" />
              <FiMessageCircle className="h-5 w-5 hover:text-foreground" />
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ProfitPulze. All rights reserved.</p>
          <p className="max-w-2xl text-center sm:text-right">
            Cryptocurrency trading involves significant risk and may not be suitable for
            all investors. Nothing on this site constitutes financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
