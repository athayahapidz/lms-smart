"use client";

import Link from "next/link";
import { logout } from "@/lib/auth";

export default function Navbar() {
  return (
    <nav className="border-b bg-white px-6 py-4 flex justify-between items-center">
      <Link href="/dashboard" className="font-bold text-xl text-blue-600">
        LMS Smart
      </Link>

      <div className="flex gap-4 items-center">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}