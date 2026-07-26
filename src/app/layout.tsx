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
  title: "Vehicle Access",
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
      <body className="min-h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white" style={{ fontFamily: 'var(--font-sans)' }}>
        <AuthProvider>
          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
