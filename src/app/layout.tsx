import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stop Reparto - Agentic Simulator",
  description: "Simulator for Stop Reparto Agentic Bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
