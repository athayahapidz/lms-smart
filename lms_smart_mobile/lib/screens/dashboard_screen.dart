import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'class_detail_screen.dart';
import 'login_screen.dart';
import 'profile_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final api = ApiService();

  List classes = [];

  final classNameController = TextEditingController();
  final classDescController = TextEditingController();
  final joinCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadClasses();
  }

  Future<void> loadClasses() async {
    final res = await api.dio.get('/classes/my');
    setState(() => classes = res.data);
  }

  Future<void> deleteClass(String classId) async {
    await api.dio.delete('/classes/$classId');
    loadClasses();
  }

  Future<void> createClass() async {
    await api.dio.post('/classes', data: {
      'name': classNameController.text,
      'description': classDescController.text,
    });

    classNameController.clear();
    classDescController.clear();
    loadClasses();
  }

  Future<void> joinClass() async {
    await api.dio.post('/classes/join', data: {
      'code': joinCodeController.text,
    });

    joinCodeController.clear();
    loadClasses();
  }

  Future<void> logout() async {
    await api.clearSession();

    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  void showCreateClassDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Buat Kelas'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: classNameController,
              decoration: const InputDecoration(labelText: 'Nama kelas'),
            ),
            TextField(
              controller: classDescController,
              decoration: const InputDecoration(labelText: 'Deskripsi'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              createClass();
            },
            child: const Text('Buat'),
          ),
        ],
      ),
    );
  }

  void showJoinClassDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Join Kelas'),
        content: TextField(
          controller: joinCodeController,
          decoration: const InputDecoration(labelText: 'Kode kelas'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              joinClass();
            },
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LMS Smart'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: logout,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: loadClasses,
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: classes.length,
          itemBuilder: (context, index) {
            final item = classes[index];
            final classData = item['classes'];

            return Card(
              child: ListTile(
                title: Text(classData['name']),
                subtitle: Text(
                  'Role: ${item['role']}\nKode: ${classData['code']}',
                ),
                isThreeLine: true,

                trailing: item['role'] == 'owner'
                    ? IconButton(
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
                                  onPressed: () =>
                                      Navigator.pop(context, false),
                                  child: const Text('Batal'),
                                ),
                                FilledButton(
                                  onPressed: () =>
                                      Navigator.pop(context, true),
                                  child: const Text('Hapus'),
                                ),
                              ],
                            ),
                          );

                          if (confirm == true) {
                            await deleteClass(classData['id']);

                            if (!mounted) return;

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Kelas berhasil dihapus'),
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
                      builder: (_) => ClassDetailScreen(
                        classId: classData['id'],
                      ),
                    ),
                  ).then((_) => loadClasses());
                },
              ),
            );
          },
        ),
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: 'join',
            onPressed: showJoinClassDialog,
            child: const Icon(Icons.group_add),
          ),
          const SizedBox(height: 12),
          FloatingActionButton(
            heroTag: 'create',
            onPressed: showCreateClassDialog,
            child: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}