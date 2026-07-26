import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";

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
      <body className="min-h-full bg-slate-950 text-white" style={{ fontFamily: 'var(--font-sans)' }}>
        <AuthProvider>
          <AuthGuard>
            <div className="flex min-h-screen">
              <Sidebar />
              <MobileHeader />
              <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
                <div className="p-4 sm:p-6 lg:p-8">{children}</div>
              </main>
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
