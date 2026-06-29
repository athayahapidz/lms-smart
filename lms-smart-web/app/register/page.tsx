"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/register", form);

      if (res.data.session) {
        saveSession(res.data.session);
        router.push("/dashboard");
      } else {
        alert("Register berhasil. Silakan login.");
        router.push("/login");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Register gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Register LMS Smart</h1>

        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Nama"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="w-full border p-3 rounded-lg"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="w-full bg-blue-600 text-white p-3 rounded-lg">
          {loading ? "Loading..." : "Register"}
        </button>

        <p className="text-center text-sm">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}