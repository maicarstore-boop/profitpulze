import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProfitPulze — Trade Crypto with Confidence",
  description:
    "A next-generation cryptocurrency exchange for spot, margin, and futures trading — real-time markets, staking, and an AI trading assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <ThemeProvider
          attribute="data-theme"
          themes={["light", "dark", "amoled"]}
          defaultTheme="dark"
          enableSystem={false}
        >
          <AuthProvider initialUser={null}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
