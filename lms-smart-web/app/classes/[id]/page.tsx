"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    rubric: "",
    due_date: "",
  });


  async function deleteClass() {
    const confirmDelete = confirm(
      "Yakin ingin menghapus kelas ini? Semua task dan submission akan ikut terhapus."
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/classes/${classId}`);
      alert("Kelas berhasil dihapus");
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus kelas");
    }
  }

  async function loadData() {
    const classRes = await api.get(`/classes/${classId}`);
    setClassData(classRes.data);

    const taskRes = await api.get(`/tasks/class/${classId}`);
    setTasks(taskRes.data);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();

    await api.post("/tasks", {
      class_id: classId,
      title: form.title,
      description: form.description,
      rubric: form.rubric,
      due_date: form.due_date || null,
    });

    setForm({
      title: "",
      description: "",
      rubric: "",
      due_date: "",
    });

    loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  const currentUserIsOwner = classData?.class_members?.some(
    (m: any) => m.role === "owner"
  );

  return (
    <Protected>
      <Navbar />

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {classData && (
          <section className="bg-white p-6 rounded-xl shadow">
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <p className="text-gray-600">{classData.description}</p>

            <div className="mt-4">
              <span className="text-sm">Kode kelas:</span>
              <span className="ml-2 font-mono bg-gray-100 px-3 py-1 rounded">
                {classData.code}
              </span>
            </div>
          </section>
        )}

        {currentUserIsOwner && (
          <div className="space-y-4">
              <button
                onClick={deleteClass}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Delete Class
              </button>

              <form onSubmit={createTask} className="bg-white p-6 rounded-xl shadow space-y-3">
                <h2 className="font-bold text-xl">Buat Task</h2>

                <input
                  className="w-full border p-3 rounded-lg"
                  placeholder="Judul task"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <textarea
                  className="w-full border p-3 rounded-lg"
                  placeholder="Deskripsi task"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <textarea
                  className="w-full border p-3 rounded-lg"
                  placeholder="Rubrik penilaian"
                  rows={5}
                  value={form.rubric}
                  onChange={(e) => setForm({ ...form, rubric: e.target.value })}
                />

                <input
                  className="w-full border p-3 rounded-lg"
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />

                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Buat Task
                </button>
              </form>

              

          </div>
          
          
        )}

        <section className="space-y-3">
          <h2 className="font-bold text-xl">Daftar Task</h2>

          {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-md space-y-3"
              >
                <Link href={`/tasks/${task.id}`} className="block">
                  <h3 className="font-bold">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </Link>

                {currentUserIsOwner && (
                  <button
                    onClick={async () => {
                      const confirmDelete = confirm(
                        `Yakin ingin menghapus task "${task.title}"? Semua submission task ini juga akan terhapus.`
                      );

                      if (!confirmDelete) return;

                      try {
                        await api.delete(`/tasks/${task.id}`);
                        alert("Task berhasil dihapus");
                        loadData();
                      } catch (err: any) {
                        alert(err.response?.data?.message || "Gagal menghapus task");
                      }
                    }}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Delete Task
                  </button>
                )}
              </div>
            ))}
        </section>
      </main>
    </Protected>
  );
}