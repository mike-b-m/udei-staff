import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Header from "./component/header/header";
import Footer from "./component/footer/fouter";
import Nav from "./component/nav/nav";

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
        <Header/> 
        <div className="flex justify-center">
          <Nav/>
        {children }
          </div>
        <Footer/>
      </body>
    </html>
  );
}
