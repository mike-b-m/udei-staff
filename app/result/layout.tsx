import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/app/globals.css";
import Footer from "@/app/component/footer/fouter";
import StudentNav from "@/app/component/nav/student-nav";

export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400","500","600"]
});

export const metadata: Metadata = {
  title: "UDEI",
  description: "staff page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body className={`${inter.className} ${poppins.className} antialiased`}>
      {/* <StudentNav /> */}
      
      {/* Main Content Area */}
      <div className="transition-all duration-300">
        <main className="min-h-screen p-4 md:p-6 bg-gray-50">
          {children}
        </main>
        <Footer />
      </div>
    </body>
    </html>
  );
}
