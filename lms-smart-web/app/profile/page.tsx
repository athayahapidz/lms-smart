"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  async function loadProfile() {
    const res = await api.get("/auth/me");

    setProfile(res.data);
    setForm({
      name: res.data.name,
      email: res.data.email,
      password: "",
    });
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();

    await api.patch("/auth/profile", {
      name: form.name,
      email: form.email,
      password: form.password || undefined,
    });

    alert("Profil berhasil diperbarui");
    loadProfile();
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <Protected>
      <Navbar />

      <main className="p-6 max-w-3xl mx-auto">
        <form onSubmit={updateProfile} className="bg-white p-6 rounded-xl shadow space-y-4">
          <h1 className="text-3xl font-bold">Profile</h1>

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
            placeholder="Password baru"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Simpan Perubahan
          </button>
        </form>
      </main>
    </Protected>
  );
}