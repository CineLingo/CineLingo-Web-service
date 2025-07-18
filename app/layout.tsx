import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "9 Seconds: 내가 원하는 말을, 내가 듣고 싶은 목소리로.",
  description: "9초 길이의 짧은 녹음만으로, 내가 원하는 말을 내가 듣고 싶은 목소리로 자연스럽고 감정 있게 들려줍니다.",
  keywords: ["TTS", "Text-to-Speech", "Custom Voice", "Audio Generation", "Cinelingo"],
  authors: [{ name: "Cinelingo" }],
  creator: "Cinelingo",
  publisher: "Cinelingo",
  openGraph: {
    title: "9 Seconds: 내가 원하는 말을, 내가 듣고 싶은 목소리로.",
    description: "9초 길이의 짧은 녹음만으로, 내가 원하는 말을 내가 듣고 싶은 목소리로 자연스럽고 감정 있게 들려줍니다.",
    type: "website",
    url: defaultUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "9 Seconds: 내가 원하는 말을, 내가 듣고 싶은 목소리로.",
    description: "9초 길이의 짧은 녹음만으로, 내가 원하는 말을 내가 듣고 싶은 목소리로 자연스럽고 감정 있게 들려줍니다.",
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
