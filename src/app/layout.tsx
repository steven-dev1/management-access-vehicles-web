import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Control de Acceso Vehicular",
  description: "Sistema de Control de Acceso Vehicular",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${rubik.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#0A0A0A] text-white" style={{ fontFamily: 'var(--font-sans)' }}>
        <AuthProvider>
          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
