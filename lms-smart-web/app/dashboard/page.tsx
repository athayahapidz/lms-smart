"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");

  async function loadClasses() {
    const res = await api.get("/classes/my");
    setClasses(res.data);
  }

  async function createClass(e: React.FormEvent) {
    e.preventDefault();

    await api.post("/classes", {
      name,
      description,
    });

    setName("");
    setDescription("");
    loadClasses();
  }

  async function joinClass(e: React.FormEvent) {
    e.preventDefault();

    await api.post("/classes/join", {
      code,
    });

    setCode("");
    loadClasses();
  }

  useEffect(() => {
    loadClasses();
  }, []);

  return (
    <Protected>
      <Navbar />

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={createClass} className="bg-white p-5 rounded-xl shadow space-y-3">
            <h2 className="font-bold text-xl">Buat Kelas</h2>

            <input
              className="w-full border p-3 rounded-lg"
              placeholder="Nama kelas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <textarea
              className="w-full border p-3 rounded-lg"
              placeholder="Deskripsi kelas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Buat Kelas
            </button>
          </form>

          <form onSubmit={joinClass} className="bg-white p-5 rounded-xl shadow space-y-3">
            <h2 className="font-bold text-xl">Join Kelas</h2>

            <input
              className="w-full border p-3 rounded-lg"
              placeholder="Kode kelas"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
              Join
            </button>
          </form>
        </div>

        <section className="grid md:grid-cols-3 gap-4">
          {classes.map((item) => (
            <div
              key={item.classes.id}
              className="bg-white p-5 rounded-xl shadow hover:shadow-md space-y-3"
            >
              <Link href={`/classes/${item.classes.id}`} className="block">
                <h3 className="font-bold text-lg">{item.classes.name}</h3>
                <p className="text-sm text-gray-600">{item.classes.description}</p>
                <p className="mt-3 text-xs bg-gray-100 inline-block px-2 py-1 rounded">
                  Role: {item.role}
                </p>
              </Link>

              {item.role === "owner" && (
                <button
                  onClick={async () => {
                    const confirmDelete = confirm(
                      `Yakin ingin menghapus kelas "${item.classes.name}"? Semua task dan submission juga akan terhapus.`
                    );

                    if (!confirmDelete) return;

                    try {
                      await api.delete(`/classes/${item.classes.id}`);
                      alert("Kelas berhasil dihapus");
                      loadClasses();
                    } catch (err: any) {
                      alert(err.response?.data?.message || "Gagal menghapus kelas");
                    }
                  }}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Delete Class
                </button>
              )}
            </div>
          ))}
        </section>
      </main>
    </Protected>
  );
}