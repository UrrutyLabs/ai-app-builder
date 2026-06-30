import type { Metadata } from "next";
import { env } from "@/lib/env";
import "./theme.css";

const title = "Loop — the control plane for product → engineering translation";
const description =
  "Loop turns a vague feature idea or a refinement transcript into a structured spec, a deterministic implementation plan, and a reviewable pull request — with a human approving every step.";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title,
  description,
  applicationName: "Loop",
  openGraph: {
    type: "website",
    siteName: "Loop",
    title,
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
