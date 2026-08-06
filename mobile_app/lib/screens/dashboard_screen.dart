import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

import 'tabs/home_tab.dart';
import 'tabs/academics_tab.dart';
import 'tabs/services_tab.dart';
import 'tabs/opportunities_tab.dart';
import 'tabs/attendance_mgmt_tab.dart';
import 'tabs/library_mgmt_tab.dart';
import 'web_portal_view.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  int _currentIndex = 0;
  bool _loadingAll = false;

  Map<String, dynamic>? _attendanceData;

  Map<String, dynamic>? _finesData;
  bool _loadingFines = false;

  List<dynamic> _leadsList = [];
  bool _loadingLeads = false;

  List<dynamic> _eventsList = [];
  bool _loadingEvents = false;

  List<dynamic> _notes = [];
  bool _loadingNotes = false;

  Map<String, dynamic>? _myResume;
  bool _loadingResume = false;

  @override
  void initState() {
    super.initState();
    // Load all data when dashboard initializes
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    if (mounted) {
      setState(() => _loadingAll = true);
    }
    
    // Call in parallel using Future.wait
    await Future.wait([
      _fetchAttendance(),
      _fetchFines(),
      _fetchLeads(),
      _fetchEvents(),
      _fetchNotes(),
      _fetchResume(),
    ]);

    if (mounted) {
      setState(() => _loadingAll = false);
    }
  }

  Future<void> _fetchAttendance() async {
    final data = await _apiService.getMyAttendance();
    if (mounted) {
      setState(() {
        _attendanceData = data;
      });
    }
  }

  Future<void> _fetchFines() async {
    if (mounted) setState(() => _loadingFines = true);
    final data = await _apiService.getMyFines();
    if (mounted) {
      setState(() {
        _finesData = data;
        _loadingFines = false;
      });
    }
  }

  Future<void> _fetchLeads() async {
    if (mounted) setState(() => _loadingLeads = true);
    final data = await _apiService.getLeads();
    if (mounted) {
      setState(() {
        _leadsList = data;
        _loadingLeads = false;
      });
    }
  }

  Future<void> _fetchEvents() async {
    if (mounted) setState(() => _loadingEvents = true);
    final data = await _apiService.getEvents();
    if (mounted) {
      setState(() {
        _eventsList = data;
        _loadingEvents = false;
      });
    }
  }

  Future<void> _fetchNotes() async {
    if (mounted) setState(() => _loadingNotes = true);
    final notes = await _apiService.getNotes();
    if (mounted) {
      setState(() {
        _notes = notes;
        _loadingNotes = false;
      });
    }
  }

  Future<void> _fetchResume() async {
    if (mounted) setState(() => _loadingResume = true);
    final resume = await _apiService.getMyResume();
    if (mounted) {
      setState(() {
        _myResume = resume;
        _loadingResume = false;
      });
    }
  }

  Future<void> _pickAndUploadResume() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );

      if (result != null && result.files.single.path != null) {
        final filePath = result.files.single.path!;
        
        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Uploading resume...'), duration: Duration(seconds: 1)),
        );

        final success = await _apiService.uploadResume(filePath);

        if (!mounted) return;

        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Resume uploaded successfully!'), backgroundColor: Colors.green),
          );
          _fetchResume();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to upload resume.'), backgroundColor: Colors.redAccent),
          );
        }
      }
    } catch (e) {
      print('File picker error: $e');
    }
  }

  Future<void> _downloadNote(dynamic note) async {
    final noteId = note['id'];
    final filename = note['filename'];
    final urlPath = '${ApiService.baseUrl}/documents/notes/$noteId/download';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Downloading $filename...'), duration: const Duration(seconds: 1)),
    );

    final success = await _apiService.downloadAndOpenFile(urlPath, filename);

    if (!mounted) return;

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to download or open file. Verify your connection.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Future<void> _downloadResume() async {
    if (_myResume == null) return;
    
    final resumeId = _myResume!['id'];
    final filename = _myResume!['filename'];
    final urlPath = '${ApiService.baseUrl}/documents/resumes/$resumeId/download';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Downloading $filename...'), duration: const Duration(seconds: 1)),
    );

    final success = await _apiService.downloadAndOpenFile(urlPath, filename);

    if (!mounted) return;

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to download or open resume.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Future<bool> _uploadNote(String title, String description, String filePath) async {
    final success = await _apiService.uploadNote(title, description, filePath);
    if (success) {
      _fetchNotes();
    }
    return success;
  }

  Future<bool> _deleteNote(String noteId) async {
    final success = await _apiService.deleteNote(noteId);
    if (success) {
      _fetchNotes();
    }
    return success;
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.userProfile;
    final theme = Theme.of(context);

    final String role = user?['role']?.toString().toLowerCase() ?? '';
    final bool isStudent = role == 'student';
    final bool isTrainer = role == 'trainer';
    final bool isAssociate = role == 'associate';
    final bool isHead = role == 'head';

    final List<_TabConfig> tabItems = [];

    if (isStudent) {
      tabItems.add(_TabConfig(
        title: 'Home',
        appBarTitle: 'Academy Dashboard',
        widget: HomeTab(
          userProfile: user,
          attendanceData: _attendanceData,
          finesData: _finesData,
          leadsList: _leadsList,
          eventsList: _eventsList,
          onNavigateToTab: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          onRefreshHome: _loadAllData,
          isStudent: true,
        ),
        icon: Icons.home_rounded,
      ));
      tabItems.add(_TabConfig(
        title: 'Academics',
        appBarTitle: 'Academics & Materials',
        widget: AcademicsTab(
          attendanceData: _attendanceData,
          notesList: _notes,
          loadingNotes: _loadingNotes,
          onRefreshNotes: _fetchNotes,
          onDownloadNote: _downloadNote,
          isStudent: true,
          onUploadNote: null,
          onDeleteNote: null,
          userRole: role,
        ),
        icon: Icons.school_rounded,
      ));
      tabItems.add(_TabConfig(
        title: 'Services',
        appBarTitle: 'Services & Resumes',
        widget: ServicesTab(
          finesData: _finesData,
          myResume: _myResume,
          loadingResume: _loadingResume,
          loadingFines: _loadingFines,
          onRefreshFines: _fetchFines,
          onRefreshResume: _fetchResume,
          onUploadResume: _pickAndUploadResume,
          onDownloadResume: _downloadResume,
        ),
        icon: Icons.business_center_rounded,
      ));
      tabItems.add(_TabConfig(
        title: 'Opportunities',
        appBarTitle: 'Opportunities & Events',
        widget: OpportunitiesTab(
          leadsList: _leadsList,
          eventsList: _eventsList,
          loadingLeads: _loadingLeads,
          loadingEvents: _loadingEvents,
          onRefreshLeads: _fetchLeads,
          onRefreshEvents: _fetchEvents,
        ),
        icon: Icons.campaign_rounded,
      ));
    } else {
      // Home Tab for Staff/Admin
      String homeTitle = 'Admin Dashboard';
      if (isTrainer) homeTitle = 'Trainer Dashboard';
      if (isAssociate) homeTitle = 'Associate Dashboard';

      tabItems.add(_TabConfig(
        title: 'Home',
        appBarTitle: homeTitle,
        widget: HomeTab(
          userProfile: user,
          attendanceData: null,
          finesData: null,
          leadsList: _leadsList,
          eventsList: _eventsList,
          onNavigateToTab: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          onRefreshHome: _loadAllData,
          isStudent: false,
        ),
        icon: Icons.home_rounded,
      ));

      // Attendance Management Tab (for head and trainer)
      if (isHead || isTrainer) {
        tabItems.add(_TabConfig(
          title: 'Attendance',
          appBarTitle: 'Attendance Management',
          widget: AttendanceMgmtTab(
            userProfile: user,
            apiService: _apiService,
          ),
          icon: Icons.calendar_month_rounded,
        ));
      }

      // Library Management Tab (for head and associate)
      if (isHead || isAssociate) {
        tabItems.add(_TabConfig(
          title: 'Library',
          appBarTitle: 'Library Operations',
          widget: LibraryMgmtTab(
            userProfile: user,
            apiService: _apiService,
          ),
          icon: Icons.library_books_rounded,
        ));
      }

      // Materials Tab (common for all staff/admin)
      tabItems.add(_TabConfig(
        title: 'Materials',
        appBarTitle: 'Course Materials',
        widget: AcademicsTab(
          attendanceData: null,
          notesList: _notes,
          loadingNotes: _loadingNotes,
          onRefreshNotes: _fetchNotes,
          onDownloadNote: _downloadNote,
          isStudent: false,
          onUploadNote: _uploadNote,
          onDeleteNote: _deleteNote,
          userRole: role,
        ),
        icon: Icons.school_rounded,
      ));

      // Opportunities Tab (common for all staff/admin)
      tabItems.add(_TabConfig(
        title: 'Opportunities',
        appBarTitle: 'Opportunities & Events',
        widget: OpportunitiesTab(
          leadsList: _leadsList,
          eventsList: _eventsList,
          loadingLeads: _loadingLeads,
          loadingEvents: _loadingEvents,
          onRefreshLeads: _fetchLeads,
          onRefreshEvents: _fetchEvents,
        ),
        icon: Icons.campaign_rounded,
      ));
    }

    int safeIndex = _currentIndex;
    if (safeIndex >= tabItems.length) {
      safeIndex = 0;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(tabItems[safeIndex].appBarTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh All',
            onPressed: _loadAllData,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Logout',
            onPressed: () => authProvider.logout(),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  user?['name']?[0]?.toUpperCase() ?? (isStudent ? 'S' : 'A'),
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: theme.primaryColor),
                ),
              ),
              accountName: Text(user?['name'] ?? (isStudent ? 'Student' : 'User')),
              accountEmail: Text(user?['email'] ?? 'email@academy.com'),
            ),
            ...tabItems.asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value;
              return ListTile(
                leading: Icon(item.icon),
                title: Text(item.title),
                selected: safeIndex == idx,
                onTap: () {
                  Navigator.pop(context);
                  setState(() => _currentIndex = idx);
                },
              );
            }).toList(),
            if (!isStudent) ...[
              const Divider(),
              ListTile(
                leading: const Icon(Icons.language_rounded),
                title: const Text('Web Portal'),
                onTap: () {
                  Navigator.pop(context); // close drawer
                  showDialog(
                    context: context,
                    builder: (context) => const AlertDialog(
                      contentPadding: EdgeInsets.zero,
                      content: SizedBox(
                        height: 380,
                        child: WebPortalView(),
                      ),
                    ),
                  );
                },
              ),
            ],
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout_rounded),
              title: const Text('Logout'),
              onTap: () {
                Navigator.pop(context); // close drawer
                authProvider.logout();
              },
            ),
          ],
        ),
      ),
      body: _loadingAll
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading portal data, please wait...', style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : IndexedStack(
              index: safeIndex,
              children: tabItems.map((e) => e.widget).toList(),
            ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: safeIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        items: tabItems.map((item) => BottomNavigationBarItem(
          icon: Icon(item.icon),
          activeIcon: Icon(item.icon, color: Colors.indigo),
          label: item.title,
        )).toList(),
      ),
    );
  }
}

class _TabConfig {
  final String title;
  final String appBarTitle;
  final Widget widget;
  final IconData icon;

  const _TabConfig({
    required this.title,
    required this.appBarTitle,
    required this.widget,
    required this.icon,
  });
}
