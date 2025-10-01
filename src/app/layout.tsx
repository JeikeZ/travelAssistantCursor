import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Assistant - Smart Packing Lists",
  description: "Generate personalized packing lists for your trips and never forget essential items again.",
  keywords: ["travel", "packing", "checklist", "assistant", "AI", "vacation", "trip planning"],
  authors: [{ name: "Travel Assistant Team" }],
  openGraph: {
    title: "Travel Assistant - Smart Packing Lists",
    description: "Generate personalized packing lists for your trips and never forget essential items again.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Assistant - Smart Packing Lists",
    description: "Generate personalized packing lists for your trips and never forget essential items again.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen antialiased`}>
        <ToastProvider>
          <ErrorBoundary>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }>
              <div className="min-h-screen">
                {children}
              </div>
            </Suspense>
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}
