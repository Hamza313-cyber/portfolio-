import type { Metadata, Viewport } from "next";
// Fonts are self-hosted from npm packages, so no request goes to an outside font server.
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/great-vibes/400.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tabish-portfolio-xi.vercel.app"),
  title: {
    default: "Tabish Ali Khan | AI Automation Developer",
    template: "%s | Tabish Ali Khan",
  },
  description:
    "Tabish Ali Khan builds n8n automations, AI-powered workflows, Excel reporting tools, websites and custom web apps for real business problems.",
  keywords: [
    "Tabish Ali Khan",
    "AI Automation Developer",
    "n8n automation",
    "AI automation",
    "Python developer",
    "Next.js developer",
    "business automation",
    "web app developer",
  ],
  authors: [{ name: "Tabish Ali Khan" }],
  creator: "Tabish Ali Khan",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "Tabish Ali Khan | AI Automation Developer",
    description:
      "Practical AI automation, business websites, web apps and software tools.",
    url: "/",
    siteName: "Tabish Ali Khan",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tabish Ali Khan | AI Automation Developer",
    description:
      "Practical AI automation, business websites, web apps and software tools.",
  },
};

export const viewport: Viewport = {
  themeColor: "#101513",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
