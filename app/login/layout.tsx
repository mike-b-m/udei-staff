import "@/app/globals.css";
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("SUPABASE URL IS:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  return (
    <html lang="en">
      <body className="antialiased bg-linear-to-br from-blue-50 via-white to-indigo-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
