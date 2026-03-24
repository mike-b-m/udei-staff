import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/app/globals.css";
import Footer from "@/app/component/footer/fouter";


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
    <body
        className={`${inter.className} ${poppins.className} antialiased`}
      >
        <div className="flex  right-0 pb-10 bg-gray-400">
              <div className="ml-8 mr-8 justify-items-center mt-8 w-full">{children }</div>
          </div>
        <Footer/>
      </body>
    </html>
  );
}
