import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { SocketProvider } from "@/providers/SocketProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "99 Placement RMS",
  description: "Enterprise-grade placement consultancy platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-zinc-950">
      <body className={`${inter.variable} font-sans antialiased text-slate-800 bg-zinc-50`}>
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              <SocketProvider>
                {children}
              </SocketProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
