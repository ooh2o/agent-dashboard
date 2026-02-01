import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/themes.css";
import { ThemeProvider } from "@/components/os/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenClaw OS",
  description: "The Operating System for AI Agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark accent-blue" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--os-bg-base)] text-[var(--os-fg-primary)]`}
      >
        <ThemeProvider defaultMode="dark" defaultAccent="blue">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
