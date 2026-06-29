import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS Smart",
  description: "Learning Management System with AI Grading",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-100 text-gray-900">{children}</body>
    </html>
  );
}