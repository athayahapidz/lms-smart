import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'task_detail_screen.dart';

class ClassDetailScreen extends StatefulWidget {
  final String classId;

  const ClassDetailScreen({super.key, required this.classId});

  @override
  State<ClassDetailScreen> createState() => _ClassDetailScreenState();
}

class _ClassDetailScreenState extends State<ClassDetailScreen> {
  final api = ApiService();

  dynamic classData;
  List tasks = [];

  final titleController = TextEditingController();
  final descController = TextEditingController();
  final rubricController = TextEditingController();

  bool isOwner = false;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    final classRes = await api.dio.get('/classes/${widget.classId}');
    final taskRes = await api.dio.get('/tasks/class/${widget.classId}');

    final members = classRes.data['class_members'] as List;

    setState(() {
      classData = classRes.data;
      tasks = taskRes.data;
      isOwner = members.any((m) => m['role'] == 'owner');
    });
  }

  Future<void> deleteTask(String taskId) async {
    try {
      await api.dio.delete('/tasks/$taskId');
      await loadData();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal menghapus task: $e'),
        ),
      );
    }
  }

  Future<void> deleteClass() async {
    try {
      await api.dio.delete('/classes/${widget.classId}');

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Kelas berhasil dihapus'),
        ),
      );

      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal menghapus kelas: $e'),
        ),
      );
    }
  }

  Future<void> createTask() async {
    await api.dio.post('/tasks', data: {
      'class_id': widget.classId,
      'title': titleController.text,
      'description': descController.text,
      'rubric': rubricController.text,
    });

    titleController.clear();
    descController.clear();
    rubricController.clear();

    loadData();
  }

  void showCreateTaskDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Buat Task'),
        content: SingleChildScrollView(
          child: Column(
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Judul task'),
              ),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: 'Deskripsi task'),
              ),
              TextField(
                controller: rubricController,
                maxLines: 5,
                decoration: const InputDecoration(labelText: 'Rubrik penilaian'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              createTask();
            },
            child: const Text('Buat'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (classData == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(classData['name']),
        actions: [
          if (isOwner)
            IconButton(
              icon: const Icon(
                Icons.delete,
                color: Colors.red,
              ),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Hapus Kelas'),
                    content: const Text(
                      'Yakin ingin menghapus kelas ini? Semua task dan submission akan ikut terhapus.',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Batal'),
                      ),
                      FilledButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('Hapus'),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  await deleteClass();
                }
              },
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: Text(classData['name']),
              subtitle: Text(
                '${classData['description'] ?? ''}\nKode kelas: ${classData['code']}',
              ),
              isThreeLine: true,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Daftar Task',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          ...tasks.map(
            (task) => Card(
              child: ListTile(
                title: Text(task['title']),
                subtitle: Text(task['description'] ?? ''),

                trailing: isOwner
                    ? IconButton(
                        icon: const Icon(
                          Icons.delete,
                          color: Colors.red,
                        ),
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: const Text('Hapus Task'),
                              content: const Text(
                                'Yakin ingin menghapus task ini? Semua submission akan ikut terhapus.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context, false),
                                  child: const Text('Batal'),
                                ),
                                FilledButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  child: const Text('Hapus'),
                                ),
                              ],
                            ),
                          );

                          if (confirm == true) {
                            await deleteTask(task['id']);

                            if (!mounted) return;

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Task berhasil dihapus'),
                              ),
                            );
                          }
                        },
                      )
                    : null,

                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TaskDetailScreen(
                        taskId: task['id'],
                      ),
                    ),
                  ).then((_) => loadData());
                },
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: isOwner
          ? FloatingActionButton(
              onPressed: showCreateTaskDialog,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}