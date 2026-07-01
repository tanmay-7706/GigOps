import type { Metadata } from "next";
import { Nunito, DM_Sans } from "next/font/google";
import "./globals.css";
import { ClayBlobs } from "@/components/clay/ClayBlobs";

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["700", "800", "900"],
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GigOps — AI Operations Desk",
  description: "Triage customer feedback, draft actions, and track gig-workforce quality in real time.",
};

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeInit = `(function(){try{var t=localStorage.getItem("gigops-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunito.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="relative flex min-h-full flex-col bg-clay-canvas text-clay-fg">
        <ClayBlobs />
        {children}
      </body>
    </html>
  );
}
