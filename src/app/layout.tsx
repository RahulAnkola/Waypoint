import type { Metadata } from "next";
import { Inter, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ScrollProgress from "@/components/ScrollProgress";
import ThemeProvider from "@/components/ThemeProvider";
import FooterWrapper from "@/components/FooterWrapper";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Waypoint — Road Trip Planner",
  description: "Plan your perfect road trip with Waypoint",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSerif.variable} ${jetbrains.variable} min-h-screen`}>
        <ThemeProvider>
          <ScrollProgress />
          <Navbar />
          <main>{children}</main>
          <FooterWrapper />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
