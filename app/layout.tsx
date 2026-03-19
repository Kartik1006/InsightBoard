import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { DataStoreProvider } from "@/hooks/useDataStore";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "InsightBoard — Instant Data Dashboards",
  description:
    "Upload any data file and instantly generate beautiful, interactive dashboards. No coding required.",
  keywords: ["dashboard", "data visualization", "analytics", "CSV", "Excel"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans`}>
        <ThemeProvider>
          <DataStoreProvider>
            {children}
          </DataStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
