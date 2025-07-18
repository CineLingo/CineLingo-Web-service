import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Cinelingo Custom TTS Web",
  description: "Custom Text-to-Speech web application - Upload reference audio and generate TTS with your own voice",
  keywords: ["TTS", "Text-to-Speech", "Custom Voice", "Audio Generation", "Cinelingo"],
  authors: [{ name: "Cinelingo" }],
  creator: "Cinelingo",
  publisher: "Cinelingo",
  openGraph: {
    title: "Cinelingo Custom TTS Web",
    description: "Custom Text-to-Speech web application - Upload reference audio and generate TTS with your own voice",
    type: "website",
    url: defaultUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cinelingo Custom TTS Web",
    description: "Custom Text-to-Speech web application - Upload reference audio and generate TTS with your own voice",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
