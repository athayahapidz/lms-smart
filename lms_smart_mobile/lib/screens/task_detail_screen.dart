import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TaskDetailScreen extends StatefulWidget {
  final String taskId;

  const TaskDetailScreen({super.key, required this.taskId});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  final api = ApiService();

  dynamic task;
  dynamic mySubmission;
  List submissions = [];

  bool loading = false;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    final taskRes = await api.dio.get('/tasks/${widget.taskId}');

    dynamic mySub;
    List allSubs = [];

    try {
      final res = await api.dio.get('/submissions/task/${widget.taskId}/me');
      mySub = res.data;
    } catch (_) {}

    try {
      final res = await api.dio.get('/submissions/task/${widget.taskId}');
      allSubs = res.data;
    } catch (_) {}

    setState(() {
      task = taskRes.data;
      mySubmission = mySub;
      submissions = allSubs;
    });
  }

  Future<void> pickAndSubmitFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'docx'],
      withData: kIsWeb,
    );

    if (result == null) return;

    final file = result.files.first;

    setState(() => loading = true);

    try {
      MultipartFile multipartFile;

      if (kIsWeb) {
        if (file.bytes == null) {
          throw Exception("File tidak dapat dibaca.");
        }

        multipartFile = MultipartFile.fromBytes(
          file.bytes!,
          filename: file.name,
        );
      } else {
        multipartFile = await MultipartFile.fromFile(
          file.path!,
          filename: file.name,
        );
      }

      final formData = FormData.fromMap({
        'file': multipartFile,
      });

      await api.dio.post(
        '/submissions/task/${widget.taskId}',
        data: formData,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Jawaban berhasil disubmit dan dinilai'),
        ),
      );

      await loadData();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal submit: $e'),
        ),
      );
    }

    setState(() => loading = false);
  }

  Future<void> reviewSubmission(String submissionId) async {
    final scoreController = TextEditingController();
    final gradeController = TextEditingController();
    final feedbackController = TextEditingController();

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Review Nilai'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: scoreController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Score'),
            ),
            TextField(
              controller: gradeController,
              decoration: const InputDecoration(labelText: 'Grade'),
            ),
            TextField(
              controller: feedbackController,
              decoration: const InputDecoration(labelText: 'Feedback'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          FilledButton(
            onPressed: () async {
              await api.dio.patch('/submissions/$submissionId/review', data: {
                'score': int.tryParse(scoreController.text) ?? 0,
                'grade': gradeController.text,
                'feedback': feedbackController.text,
              });

              if (!mounted) return;

              Navigator.pop(context);
              loadData();
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (task == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(task['title']),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    task['title'],
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(task['description'] ?? ''),
                  const SizedBox(height: 12),
                  Text('Rata-rata nilai: ${task['average_score']}'),
                  const SizedBox(height: 12),
                  const Text('Rubrik:', style: TextStyle(fontWeight: FontWeight.bold)),
                  Text(task['rubric']),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: loading ? null : pickAndSubmitFile,
            icon: const Icon(Icons.upload_file),
            label: Text(loading ? 'Menilai otomatis...' : 'Submit PDF/DOCX'),
          ),
          const SizedBox(height: 20),
          if (mySubmission != null) buildMyResult(),
          if (submissions.isNotEmpty) buildOwnerSubmissions(),
        ],
      ),
    );
  }

  Widget buildMyResult() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Hasil Penilaian Saya',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text('File: ${mySubmission['file_name']}'),
            Text('Grade: ${mySubmission['grade']}'),
            Text('Score: ${mySubmission['score']}/${mySubmission['max_score']}'),
            Text('Status: ${mySubmission['status']}'),
            const SizedBox(height: 12),
            const Text('Feedback:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text(mySubmission['feedback'] ?? ''),
          ],
        ),
      ),
    );
  }

  Widget buildOwnerSubmissions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Semua Submission',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        ...submissions.map(
          (sub) => Card(
            child: ListTile(
              title: Text(sub['profiles']?['name'] ?? 'Unknown'),
              subtitle: Text(
                'Score: ${sub['score']}/${sub['max_score']}\nGrade: ${sub['grade']}\nStatus: ${sub['status']}',
              ),
              isThreeLine: true,
              trailing: IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => reviewSubmission(sub['id']),
              ),
            ),
          ),
        ),
      ],
    );
  }
}