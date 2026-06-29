"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  const [isOwner, setIsOwner] = useState(false);

  const [task, setTask] = useState<any>(null);
  const [mySubmission, setMySubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);


  async function deleteTask() {
    const confirmDelete = confirm(
      "Yakin ingin menghapus task ini? Semua submission akan ikut terhapus."
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      alert("Task berhasil dihapus");
      router.back();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus task");
    }
  }

  async function loadTask() {
    const res = await api.get(`/tasks/${taskId}`);
    setTask(res.data);

    try {
      const subRes = await api.get(`/submissions/task/${taskId}/me`);
      setMySubmission(subRes.data);
      
    } catch {}

    try {
      const allSubRes = await api.get(`/submissions/task/${taskId}`);
      setSubmissions(allSubRes.data);
      setIsOwner(true)
    } catch {}
  }

  async function submitAssignment(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert("Pilih file terlebih dahulu");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoadingSubmit(true);

    try {
      await api.post(`/submissions/task/${taskId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Tugas berhasil dikumpulkan dan dinilai otomatis");
      loadTask();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal submit tugas");
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function downloadResult() {
    if (!mySubmission) return;

    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);
    doc.text("LMS Smart", 20, y);

    y += 10;

    doc.setFontSize(16);
    doc.text("Hasil Penilaian Tugas", 20, y);

    y += 15;

    doc.setFontSize(12);

    doc.text(`File : ${mySubmission.file_name}`, 20, y);
    y += 8;

    doc.text(`Grade : ${mySubmission.grade}`, 20, y);
    y += 8;

    doc.text(
      `Score : ${mySubmission.score}/${mySubmission.max_score}`,
      20,
      y
    );

    y += 15;

    doc.setFontSize(14);
    doc.text("Feedback", 20, y);

    y += 8;

    doc.setFontSize(12);

    const feedback = doc.splitTextToSize(
      mySubmission.feedback ?? "",
      170
    );

    doc.text(feedback, 20, y);

    y += feedback.length * 7 + 10;

    doc.setFontSize(14);
    doc.text("Detail Penilaian", 20, y);

    y += 10;

    mySubmission.criteria_scores?.forEach((item: any) => {
      doc.setFontSize(12);

      doc.text(`Kriteria : ${item.criterion}`, 20, y);
      y += 7;

      doc.text(
        `Nilai : ${item.score}/${item.max_score}`,
        25,
        y
      );
      y += 7;

      doc.text(`Bobot : ${item.weight}`, 25, y);
      y += 7;

      const comment = doc.splitTextToSize(
        item.comment ?? "",
        160
      );

      doc.text(comment, 25, y);

      y += comment.length * 7 + 8;

      // Halaman baru jika hampir penuh
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`grading-result-${taskId}.pdf`);
  }

  async function reviewSubmission(submissionId: string) {
    const score = prompt("Masukkan nilai baru:");
    const grade = prompt("Masukkan grade baru:");
    const feedback = prompt("Masukkan feedback baru:");

    if (!score || !grade) return;

    await api.patch(`/submissions/${submissionId}/review`, {
      score: Number(score),
      grade,
      feedback,
    });

    alert("Nilai berhasil direview");
    loadTask();
  }

  async function openFile(submissionId: string) {
    const res = await api.get(`/submissions/${submissionId}/file-url`);
    window.open(res.data.signedUrl, "_blank");
  }

  useEffect(() => {
    loadTask();
  }, []);

  return (
    <Protected>
      <Navbar />

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {task && (
          <>
            <section className="bg-white p-6 rounded-xl shadow space-y-3">
              <h1 className="text-3xl font-bold">{task.title}</h1>
              <p>{task.description}</p>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Rubrik</h3>
                <pre className="whitespace-pre-wrap text-sm">{task.rubric}</pre>
              </div>

              <p className="font-semibold">
                Rata-rata nilai: {task.average_score}
              </p>
            </section>

            {isOwner && (
              <button
                onClick={deleteTask}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete Task
              </button>
            )}
          </>
        )}

        <form onSubmit={submitAssignment} className="bg-white p-6 rounded-xl shadow space-y-3">
          <h2 className="font-bold text-xl">Kumpulkan Jawaban</h2>

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            disabled={loadingSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {loadingSubmit ? "Menilai otomatis..." : "Submit Jawaban"}
          </button>
        </form>

        {mySubmission && (
          <section className="bg-white p-6 rounded-xl shadow space-y-3">
            <h2 className="font-bold text-xl">Hasil Penilaian Saya</h2>

            <p>File: {mySubmission.file_name}</p>
            <p>Grade: {mySubmission.grade}</p>
            <p>
              Score: {mySubmission.score}/{mySubmission.max_score}
            </p>
            <p>Status: {mySubmission.status}</p>

            <div>
              <h3 className="font-bold">Feedback</h3>
              <p className="whitespace-pre-wrap">{mySubmission.feedback}</p>
            </div>

            {mySubmission.criteria_scores?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-3">Detail Penilaian</h3>

                <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Kriteria</th>
                      <th className="border p-2 text-center">Bobot</th>
                      <th className="border p-2 text-center">Nilai</th>
                      <th className="border p-2 text-left">Komentar</th>
                    </tr>
                  </thead>

                  <tbody>
                    {mySubmission.criteria_scores.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border p-2">{item.criterion}</td>
                        <td className="border p-2 text-center">
                          {item.weight}/{item.max_score}
                        </td>
                        <td className="border p-2 text-center">
                          {item.score}
                        </td>
                        <td className="border p-2">
                          {item.comment}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={downloadResult}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Download Hasil Penilaian
            </button>
          </section>
        )}

        {submissions.length > 0 && (
          <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="font-bold text-xl">Semua Submission Owner</h2>

            {submissions.map((sub) => (
              <div key={sub.id} className="border rounded-lg p-4 space-y-2">
                <p className="font-bold">
                  {sub.profiles?.name} - {sub.profiles?.email}
                </p>
                <p>File: {sub.file_name}</p>
                <p>
                  Score: {sub.score}/{sub.max_score}
                </p>
                <p>Grade: {sub.grade}</p>
                <p>Status: {sub.status}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => openFile(sub.id)}
                    className="bg-gray-700 text-white px-3 py-2 rounded-lg"
                  >
                    Lihat File
                  </button>

                  <button
                    onClick={() => reviewSubmission(sub.id)}
                    className="bg-yellow-500 text-white px-3 py-2 rounded-lg"
                  >
                    Review Nilai
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </Protected>
  );
}