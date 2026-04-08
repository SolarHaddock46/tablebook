import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "TableBook",
  description: "Restaurant booking platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
