import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

class AcademicsTab extends StatelessWidget {
  final Map<String, dynamic>? attendanceData;
  final List<dynamic> notesList;
  final bool loadingNotes;
  final Future<void> Function() onRefreshNotes;
  final Future<void> Function(dynamic) onDownloadNote;
  final bool isStudent;
  final Future<bool> Function(String title, String description, String filePath)? onUploadNote;
  final Future<bool> Function(String noteId)? onDeleteNote;
  final String? userRole;

  const AcademicsTab({
    super.key,
    required this.attendanceData,
    required this.notesList,
    required this.loadingNotes,
    required this.onRefreshNotes,
    required this.onDownloadNote,
    required this.isStudent,
    this.onUploadNote,
    this.onDeleteNote,
    this.userRole,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final records = attendanceData?['records'] as List<dynamic>? ?? [];

    if (!isStudent) {
      final canUpload = userRole == 'head' || userRole == 'trainer';
      return Scaffold(
        body: _buildStudyMaterials(context),
        floatingActionButton: canUpload
            ? FloatingActionButton.extended(
                backgroundColor: theme.primaryColor,
                foregroundColor: Colors.white,
                onPressed: () => _showUploadDialog(context),
                icon: const Icon(Icons.upload_file_rounded),
                label: const Text('Upload Material'),
              )
            : null,
      );
    }

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          // Sub-Tab bar
          Container(
            color: Colors.white,
            child: TabBar(
              labelColor: theme.primaryColor,
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: theme.primaryColor,
              indicatorWeight: 3,
              tabs: const [
                Tab(
                  icon: Icon(Icons.calendar_month_rounded),
                  text: 'Attendance Log',
                ),
                Tab(
                  icon: Icon(Icons.library_books_rounded),
                  text: 'Study Materials',
                ),
              ],
            ),
          ),
          
          // Tab views
          Expanded(
            child: TabBarView(
              children: [
                // TAB 1: ATTENDANCE LOG
                _buildAttendanceLog(context, records),

                // TAB 2: STUDY MATERIALS
                _buildStudyMaterials(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceLog(BuildContext context, List<dynamic> records) {
    if (records.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy_rounded, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No attendance records found.',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: records.length,
      itemBuilder: (context, index) {
        final record = records[index];
        final dateStr = record['date'] ?? 'Unknown Date';
        
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 6),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      dateStr,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const Icon(Icons.arrow_right_alt, color: Colors.indigo, size: 20),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSessionBadge('Session 1', record['session_1']),
                    _buildSessionBadge('Session 2', record['session_2']),
                    _buildSessionBadge('Session 3', record['session_3']),
                    _buildSessionBadge('Session 4', record['session_4']),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSessionBadge(String label, dynamic status) {
    final statusStr = status?.toString() ?? 'None';
    Color bgColor = Colors.grey[200]!;
    Color textColor = Colors.grey[700]!;
    String displayStatus = 'N/A';

    switch (statusStr.toLowerCase()) {
      case 'present':
        bgColor = Colors.green[50]!;
        textColor = Colors.green[800]!;
        displayStatus = 'Present';
        break;
      case 'absent':
        bgColor = Colors.red[50]!;
        textColor = Colors.red[800]!;
        displayStatus = 'Absent';
        break;
      case 'late':
        bgColor = Colors.orange[50]!;
        textColor = Colors.orange[800]!;
        displayStatus = 'Late';
        break;
      case 'none':
      default:
        bgColor = Colors.grey[100]!;
        textColor = Colors.grey[500]!;
        displayStatus = 'None';
        break;
    }

    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: textColor.withOpacity(0.15)),
        ),
        child: Column(
          children: [
            Text(
              label.replaceAll('ession ', ''), // 'S1', 'S2' etc.
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColor.withOpacity(0.8)),
            ),
            const SizedBox(height: 4),
            Text(
              displayStatus,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColor),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudyMaterials(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: onRefreshNotes,
      child: loadingNotes
          ? const Center(child: CircularProgressIndicator())
          : notesList.isEmpty
              ? ListView(
                  children: const [
                    SizedBox(height: 100),
                    Center(
                      child: Text(
                        'No study materials uploaded yet.',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  ],
                )
              : ListView.builder(
                  padding: const EdgeInsets.only(left: 12, right: 12, top: 12, bottom: 80),
                  itemCount: notesList.length,
                  itemBuilder: (context, index) {
                    final note = notesList[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: CircleAvatar(
                          backgroundColor: theme.primaryColor.withOpacity(0.1),
                          child: Icon(Icons.picture_as_pdf_rounded, color: theme.primaryColor),
                        ),
                        title: Text(
                          note['title'] ?? 'Title',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text(note['description'] ?? 'Description'),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.download_for_offline_rounded, color: theme.primaryColor, size: 28),
                              onPressed: () => onDownloadNote(note),
                            ),
                            if (!isStudent && (userRole == 'head' || userRole == 'trainer'))
                              IconButton(
                                icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 24),
                                onPressed: () async {
                                  final confirm = await showDialog<bool>(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      title: const Text('Delete Material'),
                                      content: Text('Are you sure you want to delete "${note['title']}"?'),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(context, false),
                                          child: const Text('Cancel'),
                                        ),
                                        ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.redAccent,
                                            foregroundColor: Colors.white,
                                          ),
                                          onPressed: () => Navigator.pop(context, true),
                                          child: const Text('Delete'),
                                        ),
                                      ],
                                    ),
                                  );

                                  if (confirm == true && onDeleteNote != null) {
                                    final success = await onDeleteNote!(note['id']);
                                    if (success) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Material deleted successfully.'),
                                          backgroundColor: Colors.green,
                                        ),
                                      );
                                    } else {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Failed to delete material.'),
                                          backgroundColor: Colors.redAccent,
                                        ),
                                      );
                                    }
                                  }
                                },
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  void _showUploadDialog(BuildContext context) {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    String? selectedFilePath;
    String? selectedFileName;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Upload Course Material'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: 'Title',
                        hintText: 'e.g. Flutter Basics Lecture 1',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        hintText: 'e.g. Introduction to widgets and state',
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: ['pdf', 'ppt', 'pptx'],
                          );
                          if (result != null && result.files.single.path != null) {
                            setDialogState(() {
                              selectedFilePath = result.files.single.path;
                              selectedFileName = result.files.single.name;
                            });
                          }
                        } catch (e) {
                          print('File picker error: $e');
                        }
                      },
                      icon: const Icon(Icons.file_present_rounded),
                      label: Expanded(
                        child: Text(
                          selectedFileName ?? 'Select Document (PDF/PPT)',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: (selectedFilePath == null)
                      ? null
                      : () async {
                          final title = titleController.text.trim();
                          final desc = descController.text.trim();
                          if (title.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please enter a title')),
                            );
                            return;
                          }
                          
                          Navigator.pop(context);
                          
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Uploading material...')),
                          );
                          
                          if (onUploadNote != null) {
                            final success = await onUploadNote!(title, desc, selectedFilePath!);
                            if (success) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Material uploaded successfully!'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Failed to upload material.'),
                                  backgroundColor: Colors.redAccent,
                                ),
                              );
                            }
                          }
                        },
                  child: const Text('Upload'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

