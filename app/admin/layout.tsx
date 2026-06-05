import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/app/admin/globals.css";
import Header from "@/app/component/header/header";
import Footer from "@/app/component/footer/fouter";
import Nav from "@/app/component/nav/nav";

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("SUPABASE URL IS:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <Nav />
        <div className="md:ml-20 transition-all duration-300">
          <div className="md:hidden h-14" />
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
