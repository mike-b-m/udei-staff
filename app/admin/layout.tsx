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
      
      <body
        className={`antialiased`}
      ><AuthProvider>
         <Header/>  
        <div className="flex  right-0 pb-10 bg-gray-400">
          <Nav/>
              <div className="ml-[32px] mr-[32px] justify-items-center mt-[24px] w-full">{children }</div>
          </div>
        <Footer/>
      </AuthProvider>
       
      </body>
    </html>
  );
}
