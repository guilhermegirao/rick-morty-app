import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Rick and Morty | Episode intelligence",
  description: "Explore the characters behind every Rick and Morty episode.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body className="min-h-screen bg-paper text-ink antialiased selection:bg-acid selection:text-ink"><Providers>{children}</Providers></body></html>;
}
