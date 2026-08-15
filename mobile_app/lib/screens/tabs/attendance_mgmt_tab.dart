import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../services/api_service.dart';

class AttendanceMgmtTab extends StatefulWidget {
  final Map<String, dynamic>? userProfile;
  final ApiService apiService;

  const AttendanceMgmtTab({
    super.key,
    required this.userProfile,
    required this.apiService,
  });

  @override
  State<AttendanceMgmtTab> createState() => _AttendanceMgmtTabState();
}

class _AttendanceMgmtTabState extends State<AttendanceMgmtTab> with SingleTickerProviderStateMixin {
  late TabController _subTabController;
  List<dynamic> _batches = [];
  String? _selectedBatch;
  bool _loadingBatches = false;

  // Manual Entry States
  DateTime _selectedDate = DateTime.now();
  List<dynamic> _students = [];
  Map<String, Map<String, String>> _attendanceMatrix = {}; // student_email -> session_key -> status
  bool _loadingStudents = false;
  bool _savingAttendance = false;

  // Review & Stats States
  Map<String, dynamic>? _batchStats;
  bool _loadingStats = false;

  // Import States
  String? _selectedFilePath;
  String? _selectedFileName;
  bool _uploadingFile = false;
  List<dynamic> _expectedSchema = [];
  Map<String, dynamic>? _uploadResult;

  String _formatDate(DateTime dt) {
    final year = dt.year.toString();
    final month = dt.month.toString().padLeft(2, '0');
    final day = dt.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  @override
  void initState() {
    super.initState();
    _subTabController = TabController(length: 3, vsync: this);
    _subTabController.addListener(_handleTabChange);
    _loadBatches();
  }

  @override
  void dispose() {
    _subTabController.dispose();
    super.dispose();
  }

  void _handleTabChange() {
    if (_subTabController.indexIsChanging) return;
    _refreshTabSpecificData();
  }

  void _refreshTabSpecificData() {
    if (_selectedBatch == null) return;
    
    if (_subTabController.index == 0) {
      _fetchBatchStats();
    } else if (_subTabController.index == 1) {
      _fetchManualAttendance();
    } else if (_subTabController.index == 2) {
      _fetchExpectedSchema();
    }
  }

  Future<void> _loadBatches() async {
    setState(() => _loadingBatches = true);
    final allBatches = await widget.apiService.getBatches();
    
    if (mounted) {
      final role = widget.userProfile?['role']?.toString().toLowerCase() ?? '';
      List<dynamic> filtered = allBatches;
      
      // Filter if trainer
      if (role == 'trainer') {
        final assigned = widget.userProfile?['classes_assigned'] as List<dynamic>? ?? [];
        filtered = allBatches.where((b) => assigned.contains(b['name'])).toList();
      }

      setState(() {
        _batches = filtered;
        _loadingBatches = false;
        if (_batches.isNotEmpty) {
          _selectedBatch = _batches.first['name'];
          _refreshTabSpecificData();
        }
      });
    }
  }

  // --- REVIEW STATS APIS ---
  Future<void> _fetchBatchStats() async {
    if (_selectedBatch == null) return;
    setState(() => _loadingStats = true);
    final stats = await widget.apiService.getBatchStats(_selectedBatch!);
    if (mounted) {
      setState(() {
        _batchStats = stats;
        _loadingStats = false;
      });
    }
  }

  // --- MANUAL ENTRY APIS ---
  Future<void> _fetchManualAttendance() async {
    if (_selectedBatch == null) return;
    setState(() {
      _loadingStudents = true;
      _students = [];
      _attendanceMatrix = {};
    });

    final studentsList = await widget.apiService.getBatchStudents(_selectedBatch!);
    final formattedDate = _formatDate(_selectedDate);
    final logs = await widget.apiService.getBatchAttendance(_selectedBatch!, date: formattedDate);

    if (mounted) {
      final Map<String, Map<String, String>> matrix = {};
      
      // Seed matrix with default None
      for (var s in studentsList) {
        final email = s['email']?.toString().toLowerCase() ?? '';
        matrix[email] = {
          'session_1': 'None',
          'session_2': 'None',
          'session_3': 'None',
          'session_4': 'None',
        };
      }

      // Overwrite with existing logs
      for (var record in logs) {
        final email = record['student_email']?.toString().toLowerCase() ?? '';
        if (matrix.containsKey(email)) {
          matrix[email] = {
            'session_1': record['session_1']?.toString() ?? 'None',
            'session_2': record['session_2']?.toString() ?? 'None',
            'session_3': record['session_3']?.toString() ?? 'None',
            'session_4': record['session_4']?.toString() ?? 'None',
          };
        }
      }

      setState(() {
        _students = studentsList;
        _attendanceMatrix = matrix;
        _loadingStudents = false;
      });
    }
  }

  Future<void> _saveAttendance() async {
    if (_selectedBatch == null) return;
    setState(() => _savingAttendance = true);

    final List<Map<String, dynamic>> records = [];
    _attendanceMatrix.forEach((email, sessions) {
      records.add({
        'student_email': email,
        'session_1': sessions['session_1'] ?? 'None',
        'session_2': sessions['session_2'] ?? 'None',
        'session_3': sessions['session_3'] ?? 'None',
        'session_4': sessions['session_4'] ?? 'None',
      });
    });

    final formattedDate = _formatDate(_selectedDate);
    final result = await widget.apiService.saveManualAttendance(_selectedBatch!, formattedDate, records);

    if (mounted) {
      setState(() => _savingAttendance = false);
      if (result != null && result.containsKey('error')) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error']),
            backgroundColor: Colors.redAccent,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Attendance records saved successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        _fetchManualAttendance();
      }
    }
  }

  // --- SPREADSHEET IMPORT APIS ---
  Future<void> _fetchExpectedSchema() async {
    if (_expectedSchema.isNotEmpty) return;
    final schema = await widget.apiService.getAttendanceSchema();
    if (mounted) {
      setState(() {
        _expectedSchema = schema;
      });
    }
  }

  Future<void> _pickExcelFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx'],
      );
      if (result != null && result.files.single.path != null) {
        setState(() {
          _selectedFilePath = result.files.single.path;
          _selectedFileName = result.files.single.name;
          _uploadResult = null;
        });
      }
    } catch (e) {
      print('File picker error: $e');
    }
  }

  Future<void> _uploadSpreadsheet() async {
    if (_selectedBatch == null || _selectedFilePath == null) return;
    setState(() {
      _uploadingFile = true;
      _uploadResult = null;
    });

    final result = await widget.apiService.uploadAttendanceFile(_selectedBatch!, _selectedFilePath!);

    if (mounted) {
      setState(() {
        _uploadingFile = false;
        _uploadResult = result;
      });

      if (result != null) {
        if (result.containsKey('error')) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error']),
              backgroundColor: Colors.redAccent,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Spreadsheet uploaded and processed successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          setState(() {
            _selectedFilePath = null;
            _selectedFileName = null;
          });
        }
      }
    }
  }

  // --- WIDGET BUILD ---
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Column(
        children: [
          // Batch Selector Persistent Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            color: Colors.white,
            child: Row(
              children: [
                const Icon(Icons.class_rounded, color: Colors.indigo),
                const SizedBox(width: 12),
                Expanded(
                  child: _loadingBatches
                      ? const Center(
                          child: SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : _batches.isEmpty
                          ? const Text(
                              'No classes assigned or available.',
                              style: TextStyle(fontWeight: FontWeight.w600, color: Colors.redAccent),
                            )
                          : DropdownButtonFormField<String>(
                              value: _selectedBatch,
                              decoration: const InputDecoration(
                                labelText: 'Active Class / Batch',
                                contentPadding: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                                border: OutlineInputBorder(),
                              ),
                              items: _batches.map((b) {
                                return DropdownMenuItem<String>(
                                  value: b['name']?.toString(),
                                  child: Text(b['name']?.toString() ?? 'Unnamed Batch'),
                                );
                              }).toList(),
                              onChanged: (val) {
                                setState(() {
                                  _selectedBatch = val;
                                  _refreshTabSpecificData();
                                });
                              },
                            ),
                ),
              ],
            ),
          ),

          // Sub-Tab Bar
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _subTabController,
              labelColor: theme.primaryColor,
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: theme.primaryColor,
              indicatorWeight: 3,
              tabs: const [
                Tab(
                  icon: Icon(Icons.analytics_rounded),
                  text: 'Stats & Logs',
                ),
                Tab(
                  icon: Icon(Icons.edit_calendar_rounded),
                  text: 'Manual Entry',
                ),
                Tab(
                  icon: Icon(Icons.upload_file_rounded),
                  text: 'Import XLSX',
                ),
              ],
            ),
          ),

          // Tab views
          Expanded(
            child: _selectedBatch == null
                ? const Center(
                    child: Text('Please select a batch to load data.'),
                  )
                : TabBarView(
                    controller: _subTabController,
                    children: [
                      _buildReviewStatsView(context),
                      _buildManualEntryView(context),
                      _buildImportView(context),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  // --- SUB-TAB 1: REVIEW & STATS ---
  Widget _buildReviewStatsView(BuildContext context) {
    if (_loadingStats) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_batchStats == null) {
      return const Center(child: Text('Failed to load batch metrics.'));
    }

    final daySummaries = _batchStats!['day_summaries'] as List<dynamic>? ?? [];
    final topicCounts = _batchStats!['topic_counts'] as Map<String, dynamic>? ?? {};
    final isHead = widget.userProfile?['role']?.toString().toLowerCase() == 'head';

    return RefreshIndicator(
      onRefresh: _fetchBatchStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Summary Stats Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            Text(
                              '${daySummaries.length}',
                              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.indigo),
                            ),
                            const SizedBox(height: 4),
                            Text('Conducted Days', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                          ],
                        ),
                        Container(height: 40, width: 1, color: Colors.grey[300]),
                        Column(
                          children: [
                            Text(
                              '${topicCounts.keys.length}',
                              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.indigo),
                            ),
                            const SizedBox(height: 4),
                            Text('Topics Covered', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Topics count breakdown
            if (topicCounts.isNotEmpty) ...[
              const Text(
                'Topics Cover Counter',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 10),
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(
                    children: topicCounts.entries.map((e) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                e.key,
                                style: const TextStyle(fontWeight: FontWeight.w500),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.indigo[50],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${e.value} session(s)',
                                style: const TextStyle(color: Colors.indigo, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Day summaries list
            Text(
              'Conducted Class Logs (${daySummaries.length})',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 10),

            if (daySummaries.isEmpty)
              Card(
                elevation: 0,
                color: Colors.grey[100],
                child: const Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Center(
                    child: Text('No attendance logs registered for this batch.', style: TextStyle(color: Colors.grey)),
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: daySummaries.length,
                itemBuilder: (context, index) {
                  final summary = daySummaries[index];
                  final dateStr = summary['date'] ?? 'N/A';
                  final present = summary['presents'] ?? 0;
                  final absent = summary['absents'] ?? 0;
                  final total = summary['total_students'] ?? 0;
                  final List<dynamic> topics = summary['topics'] as List<dynamic>? ?? [];

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
                              if (isHead)
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                  onPressed: () => _confirmDeleteDateAttendance(dateStr),
                                  tooltip: 'Delete Logs',
                                ),
                            ],
                          ),
                          const Divider(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Total Students: $total', style: const TextStyle(fontSize: 13)),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: Colors.green[50], borderRadius: BorderRadius.circular(8)),
                                    child: Text('Presents: $present', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(8)),
                                    child: Text('Absents: $absent', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          if (topics.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: topics.map((t) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.indigo[50],
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    t.toString(),
                                    style: const TextStyle(color: Colors.indigo, fontSize: 11, fontWeight: FontWeight.w500),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),

            // Delete All batch attendance button at the very bottom
            if (isHead && daySummaries.isNotEmpty) ...[
              const SizedBox(height: 32),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red[50],
                  foregroundColor: Colors.red[800],
                  elevation: 0,
                  side: BorderSide(color: Colors.red[300]!),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _confirmDeleteAllBatchAttendance,
                icon: const Icon(Icons.warning_amber_rounded),
                label: const Text('Delete ALL Batch Attendance Records', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  void _confirmDeleteDateAttendance(String dateStr) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Attendance Logs'),
        content: Text('Are you sure you want to delete all attendance logs for $_selectedBatch on $dateStr? This action is irreversible.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final res = await widget.apiService.deleteDateAttendance(_selectedBatch!, dateStr);
      if (mounted) {
        if (res != null && res.containsKey('error')) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['error']), backgroundColor: Colors.redAccent));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Successfully deleted logs for $dateStr.'), backgroundColor: Colors.green));
          _fetchBatchStats();
        }
      }
    }
  }

  void _confirmDeleteAllBatchAttendance() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('CRITICAL: Delete All Records'),
        content: Text('Warning! This will delete ALL attendance logs and student statistics summaries for batch "$_selectedBatch". Proceed?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete All'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final res = await widget.apiService.deleteAllBatchAttendance(_selectedBatch!);
      if (mounted) {
        if (res != null && res.containsKey('error')) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['error']), backgroundColor: Colors.redAccent));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Successfully deleted all records.'), backgroundColor: Colors.green));
          _fetchBatchStats();
        }
      }
    }
  }

  // --- SUB-TAB 2: MANUAL ENTRY ---
  Widget _buildManualEntryView(BuildContext context) {
    if (_loadingStudents) {
      return const Center(child: CircularProgressIndicator());
    }

    final role = widget.userProfile?['role']?.toString().toLowerCase() ?? '';
    final bool isHead = role == 'head';

    return Column(
      children: [
        // Date Selector & Info Box
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
          color: Colors.indigo[50],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Date: ${_formatDate(_selectedDate)}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.indigo),
              ),
              ElevatedButton.icon(
                onPressed: isHead
                    ? () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: _selectedDate,
                          firstDate: DateTime(2025),
                          lastDate: DateTime.now(),
                        );
                        if (date != null) {
                          setState(() {
                            _selectedDate = date;
                          });
                          _fetchManualAttendance();
                        }
                      }
                    : null,
                icon: const Icon(Icons.date_range_rounded, size: 18),
                label: const Text('Select Date'),
                style: ElevatedButton.styleFrom(
                  elevation: 0,
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.indigo,
                  disabledForegroundColor: Colors.grey[400],
                  disabledBackgroundColor: Colors.grey[200],
                ),
              ),
            ],
          ),
        ),

        // Students Table/List
        Expanded(
          child: _students.isEmpty
              ? const Center(
                  child: Text('No students found in this batch.'),
                )
              : ListView.builder(
                  padding: const EdgeInsets.only(left: 12, right: 12, top: 12, bottom: 80),
                  itemCount: _students.length,
                  itemBuilder: (context, index) {
                    final student = _students[index];
                    final email = student['email']?.toString().toLowerCase() ?? '';
                    final name = student['name'] ?? email;
                    final aspId = student['asp_id']?.toString() ?? 'N/A';

                    final sessions = _attendanceMatrix[email] ?? {
                      'session_1': 'None',
                      'session_2': 'None',
                      'session_3': 'None',
                      'session_4': 'None',
                    };

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
                                Expanded(
                                  child: Text(
                                    name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Text(
                                  'ASP ID: $aspId',
                                  style: TextStyle(color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildManualSessionToggler('S1', sessions['session_1']!, (newStatus) {
                                  setState(() {
                                    _attendanceMatrix[email]!['session_1'] = newStatus;
                                  });
                                }),
                                _buildManualSessionToggler('S2', sessions['session_2']!, (newStatus) {
                                  setState(() {
                                    _attendanceMatrix[email]!['session_2'] = newStatus;
                                  });
                                }),
                                _buildManualSessionToggler('S3', sessions['session_3']!, (newStatus) {
                                  setState(() {
                                    _attendanceMatrix[email]!['session_3'] = newStatus;
                                  });
                                }),
                                _buildManualSessionToggler('S4', sessions['session_4']!, (newStatus) {
                                  setState(() {
                                    _attendanceMatrix[email]!['session_4'] = newStatus;
                                  });
                                }),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),

        // Float-like Save Panel
        if (_students.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey[200]!)),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, -2)),
              ],
            ),
            child: _savingAttendance
                ? const Center(child: CircularProgressIndicator())
                : ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: _saveAttendance,
                    child: const Text('Save Attendance Records', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
          ),
      ],
    );
  }

  Widget _buildManualSessionToggler(String label, String currentStatus, Function(String) onChanged) {
    Color color = Colors.grey[200]!;
    Color textColor = Colors.grey[800]!;
    switch (currentStatus.toLowerCase()) {
      case 'present':
        color = Colors.green[100]!;
        textColor = Colors.green[800]!;
        break;
      case 'absent':
        color = Colors.red[100]!;
        textColor = Colors.red[800]!;
        break;
      case 'late':
        color = Colors.orange[100]!;
        textColor = Colors.orange[800]!;
        break;
      case 'none':
      default:
        color = Colors.grey[100]!;
        textColor = Colors.grey[600]!;
        break;
    }

    String getNextStatus(String cur) {
      if (cur == 'Present') return 'Absent';
      if (cur == 'Absent') return 'Late';
      if (cur == 'Late') return 'None';
      return 'Present';
    }

    return Expanded(
      child: GestureDetector(
        onTap: () {
          final next = getNextStatus(currentStatus);
          onChanged(next);
        },
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: textColor.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColor.withOpacity(0.8)),
              ),
              const SizedBox(height: 4),
              Text(
                currentStatus,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColor),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- SUB-TAB 3: IMPORT VIEW ---
  Widget _buildImportView(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Select File Card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Icon(Icons.description_rounded, size: 64, color: Colors.indigo),
                  const SizedBox(height: 16),
                  Text(
                    _selectedFileName ?? 'No spreadsheet selected',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _selectedFilePath != null
                        ? 'Ready to upload'
                        : 'Please select the attendance workbook (XLSX).',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.indigo,
                          side: const BorderSide(color: Colors.indigo),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        ),
                        onPressed: _pickExcelFile,
                        icon: const Icon(Icons.file_present_rounded),
                        label: const Text('Browse Files'),
                      ),
                      if (_selectedFilePath != null) ...[
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.indigo,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          ),
                          onPressed: _uploadingFile ? null : _uploadSpreadsheet,
                          icon: _uploadingFile
                              ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.cloud_upload_rounded),
                          label: Text(_uploadingFile ? 'Uploading...' : 'Process Sheet'),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Upload responses / Errors / warnings list
          if (_uploadResult != null) ...[
            Text(
              'Upload Review Result',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 10),
            Card(
              color: _uploadResult!.containsKey('error') ? Colors.red[50] : Colors.green[50],
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _uploadResult!.containsKey('error')
                          ? _uploadResult!['error']
                          : _uploadResult!['message'] ?? 'Successfully processed.',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _uploadResult!.containsKey('error') ? Colors.red[800] : Colors.green[800],
                      ),
                    ),
                    
                    // Warnings list if present
                    if (_uploadResult!.containsKey('warnings_errors') &&
                        (_uploadResult!['warnings_errors'] as List).isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Text(
                        'Warnings & Skipped Rows:',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        constraints: const BoxConstraints(maxHeight: 180),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: ListView.builder(
                          shrinkWrap: true,
                          padding: const EdgeInsets.all(8),
                          itemCount: (_uploadResult!['warnings_errors'] as List).length,
                          itemBuilder: (context, idx) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 3.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                                  Expanded(
                                    child: Text(
                                      _uploadResult!['warnings_errors'][idx].toString(),
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Display Expected Schema
          if (_expectedSchema.isNotEmpty) ...[
            const Text(
              'Spreadsheet Guidelines',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 10),
            Card(
              elevation: 0,
              color: Colors.amber[50],
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(color: Colors.amber[200]!),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline_rounded, color: Colors.amber[800], size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Required Excel Columns (Order matters)',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber[900], fontSize: 14),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _expectedSchema.map((c) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.amber[200]!),
                          ),
                          child: Text(
                            c.toString(),
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.amber[900]),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
