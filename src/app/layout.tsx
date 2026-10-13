import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Absolute base for link-preview URLs (og:image etc.). Vercel provides the production domain.
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://googlereivew-01.vercel.app";

const DESCRIPTION = "Daily Google review report for Wolhwa Galbi and KODOKODO stores in the Philippines";

export async function generateMetadata(): Promise<Metadata> {
  const title = getDictionary(await getLocale()).appTitle;
  // The preview image comes from app/opengraph-image.tsx; link previews always use the English title.
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: DESCRIPTION,
    openGraph: {
      type: "website",
      url: "/",
      siteName: "Google Review Dashboard",
      title: "Google Review Dashboard",
      description: DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: "Google Review Dashboard",
      description: DESCRIPTION,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
