import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/app/admin/globals.css";
import Header from "@/app/component/header/header";
import Footer from "@/app/component/footer/fouter";
import Nav from "@/app/component/nav/nav";
import { AuthProvider } from "../component/provider/AuthProvider";

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <AuthProvider>
          <Nav />
          
          {/* Main Layout Container */}
          <div className="md:ml-20 md:group-hover:ml-64 transition-all duration-300">
            {/* Mobile spacer for fixed header - Hidden on desktop */}
            <div className="md:hidden h-16" />
            
            {/* Header */}
            <Header />
            
            {/* Main Content */}
            <main className="min-h-screen">
              {children}
            </main>
            
            {/* Footer */}
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
