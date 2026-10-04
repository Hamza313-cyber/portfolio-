import type { Metadata } from "next";
// Fonts are self-hosted from npm packages, so no request goes to an outside font server.
import "@fontsource/cinzel/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/great-vibes/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tabish Ali Khan | AI Automation Developer",
  description:
    "Tabish Ali Khan builds n8n automations, Excel reports, websites and web apps for real business problems.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <div className="wall" aria-hidden="true" />
        <div className="shade" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
