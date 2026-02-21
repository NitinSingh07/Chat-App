import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TARS Live Chat",
  description: "Real-time messaging application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className="dark">
        <body className={`${geistSans.variable} antialiased h-screen flex flex-col overflow-hidden bg-background text-foreground`}>
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
