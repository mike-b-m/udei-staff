export const metadata = {
  title: "login",
  description: "login",
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
          
          <body>
                      {children }
          </body>
        </html>
  )
}