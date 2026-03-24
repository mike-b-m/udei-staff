import "@/app/globals.css";
import Header from "@/app/component/header/header";
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
      ><Header/>
        <div className="flex  right-0 pb-10 bg-gray-400">
              <div className="ml-[32px] mr-[32px] justify-items-center mt-[24px] w-full">{children }</div>
          </div>
      </body>
    </html>
  );
}
