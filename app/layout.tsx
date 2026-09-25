import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import AuthProvider from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "Topify — Auto-post Videos to Social Media",
  description:
    "Schedule and auto-post short videos to Facebook Reels, Instagram Reels, and YouTube Shorts. Simple, beautiful, powerful.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen font-sans`} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                  style: {
                    fontFamily: 'var(--font-sans)',
                  },
                }}
              />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
