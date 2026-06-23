import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { HeaderUserMenu } from "@/components/auth/header-user-menu";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <header className="border-b border-neutral-200 dark:border-neutral-800">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
              <Link href="/" className="font-semibold tracking-tight">
                ai-app-builder
              </Link>
              <HeaderUserMenu />
            </div>
          </header>
          <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
