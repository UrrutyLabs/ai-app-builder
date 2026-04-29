import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "ai-app-builder",
  description: "Spec-driven dev tool — vague idea → spec → plan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="mx-auto max-w-4xl px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              ai-app-builder
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
