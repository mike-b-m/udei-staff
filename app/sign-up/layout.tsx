import "@/app/globals.css";
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-linear-to-br from-blue-50 via-white to-indigo-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
