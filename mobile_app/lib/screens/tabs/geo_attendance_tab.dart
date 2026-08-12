import 'dart:math';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';

class GeoAttendanceTab extends StatefulWidget {
  const GeoAttendanceTab({super.key});

  @override
  State<GeoAttendanceTab> createState() => _GeoAttendanceTabState();
}

class _GeoAttendanceTabState extends State<GeoAttendanceTab> {
  final ApiService _apiService = ApiService();
  bool _loading = false;
  String _error = '';
  String _success = '';

  // Student specific states
  Map<String, dynamic>? _studentCenter;
  List<dynamic> _historyRecords = [];
  bool _hasMarkedToday = false;
  Position? _currentPosition;
  double? _calculatedDistance;
  bool _fetchingLocation = false;
  bool _marking = false;

  // Staff specific states
  List<dynamic> _centers = [];
  List<dynamic> _students = [];
  List<dynamic> _filteredRecords = [];
  List<dynamic> _batches = [];
  
  // Selection/filters for admin
  String? _selectedFilterCenterId;
  String? _selectedFilterBatchId;
  DateTime _selectedDate = DateTime.now();

  // Multi-select for assignments
  final Set<String> _selectedStudentIds = {};

  // Form states for creating/editing centers
  final _centerFormKey = GlobalKey<FormState>();
  final TextEditingController _centerNameController = TextEditingController();
  final TextEditingController _centerLatController = TextEditingController();
  final TextEditingController _centerLonController = TextEditingController();
  final TextEditingController _centerRadiusController = TextEditingController(text: '150');
  final TextEditingController _centerOpenTimeController = TextEditingController(text: '09:30');
  final TextEditingController _centerCloseTimeController = TextEditingController(text: '17:30');
  final TextEditingController _centerLateTimeController = TextEditingController(text: '11:00');
  String? _editingCenterId;

  // Manual correction form states
  final _correctFormKey = GlobalKey<FormState>();
  String _correctStatus = 'PRESENT';
  final TextEditingController _correctReasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _centerNameController.dispose();
    _centerLatController.dispose();
    _centerLonController.dispose();
    _centerRadiusController.dispose();
    _centerOpenTimeController.dispose();
    _centerCloseTimeController.dispose();
    _centerLateTimeController.dispose();
    _correctReasonController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    final user = Provider.of<AuthProvider>(context, listen: false).userProfile;
    if (user == null) return;

    final String role = user['role']?.toString().toLowerCase() ?? '';
    if (role == 'student') {
      await Future.wait([
        _fetchStudentCenter(),
        _fetchStudentHistory(),
      ]);
    } else {
      await Future.wait([
        _fetchCenters(),
        _fetchRecords(),
        _fetchBatches(),
      ]);
      if (['head', 'associate'].contains(role)) {
        await _fetchStudents();
      }
    }
  }

  // --- Student API Methods ---

  Future<void> _fetchStudentCenter() async {
    setState(() => _loading = true);
    try {
      final center = await _apiService.getGeoStudentCenter();
      setState(() {
        _studentCenter = center;
        _error = '';
      });
    } catch (e) {
      setState(() {
        _studentCenter = null;
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchStudentHistory() async {
    setState(() => _loading = true);
    try {
      final history = await _apiService.getGeoHistory();
      if (history != null) {
        final todayStr = DateTime.now().toIso8601String().split('T')[0];
        final marked = history.any((r) => r['date'] == todayStr);
        setState(() {
          _historyRecords = history;
          _hasMarkedToday = marked;
          _error = '';
        });
      }
    } catch (e) {
      setState(() => _error = 'Failed to load attendance logs.');
    } finally {
      setState(() => _loading = false);
    }
  }

  // Determine and request GPS coordinates
  Future<void> _requestLocation() async {
    setState(() {
      _fetchingLocation = true;
      _error = '';
      _success = '';
    });
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled on your device.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied.');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied. Please enable them in device settings.');
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      double? dist;
      if (_studentCenter != null) {
        final double centerLat = (_studentCenter!['latitude'] as num).toDouble();
        final double centerLon = (_studentCenter!['longitude'] as num).toDouble();
        dist = _calculateHaversineDistance(
          position.latitude,
          position.longitude,
          centerLat,
          centerLon,
        );
      }

      setState(() {
        _currentPosition = position;
        _calculatedDistance = dist;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _fetchingLocation = false);
    }
  }

  // Haversine Distance computation
  double _calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
    const double r = 6371000.0; // meters
    final double dLat = (lat2 - lat1) * pi / 180.0;
    final double dLon = (lon2 - lon1) * pi / 180.0;
    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180.0) * cos(lat2 * pi / 180.0) * sin(dLon / 2) * sin(dLon / 2);
    final double c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    return r * c;
  }

  Future<void> _submitAttendance() async {
    if (_currentPosition == null) return;
    setState(() {
      _marking = true;
      _error = '';
      _success = '';
    });
    try {
      final response = await _apiService.markGeoAttendance(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        _currentPosition!.accuracy,
      );
      if (response != null) {
        setState(() {
          _success = 'Your check-in has been marked successfully!';
        });
        await _fetchStudentHistory();
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _marking = false);
    }
  }

  // --- Staff API Methods ---

  Future<void> _fetchCenters() async {
    try {
      final list = await _apiService.getGeoCenters();
      if (list != null) {
        setState(() => _centers = list);
      }
    } catch (e) {
      print('Centers load error: $e');
    }
  }

  Future<void> _fetchBatches() async {
    try {
      final list = await _apiService.getBatches();
      setState(() => _batches = list);
    } catch (e) {
      print('Batches load error: $e');
    }
  }

  Future<void> _fetchStudents() async {
    final user = Provider.of<AuthProvider>(context, listen: false).userProfile;
    final String role = user?['role']?.toString().toLowerCase() ?? '';
    final String? centerFilter = role == 'associate' ? (user?['center_id']?.toString()) : _selectedFilterCenterId;
    try {
      final list = await _apiService.getGeoStudents(centerFilter);
      if (list != null) {
        setState(() => _students = list);
      }
    } catch (e) {
      print('Students load error: $e');
    }
  }

  Future<void> _fetchRecords() async {
    final user = Provider.of<AuthProvider>(context, listen: false).userProfile;
    final String role = user?['role']?.toString().toLowerCase() ?? '';
    final String? centerFilter = role == 'associate' ? (user?['center_id']?.toString()) : _selectedFilterCenterId;
    final dateStr = _selectedDate.toIso8601String().split('T')[0];
    setState(() => _loading = true);
    try {
      final list = await _apiService.getGeoRecords(dateStr, centerFilter, _selectedFilterBatchId);
      if (list != null) {
        setState(() => _filteredRecords = list);
      }
    } catch (e) {
      setState(() => _error = 'Failed to load attendance logs.');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleSaveCenter() async {
    if (!_centerFormKey.currentState!.validate()) return;
    final payload = {
      'name': _centerNameController.text.trim(),
      'latitude': double.parse(_centerLatController.text.trim()),
      'longitude': double.parse(_centerLonController.text.trim()),
      'radius_meters': double.parse(_centerRadiusController.text.trim()),
      'open_time': _centerOpenTimeController.text.trim(),
      'close_time': _centerCloseTimeController.text.trim(),
      'late_time': _centerLateTimeController.text.trim(),
    };

    setState(() {
      _loading = true;
      _error = '';
      _success = '';
    });

    try {
      Map<String, dynamic>? result;
      if (_editingCenterId != null) {
        result = await _apiService.updateGeoCenter(_editingCenterId!, payload);
      } else {
        result = await _apiService.createGeoCenter(payload);
      }

      if (result != null) {
        setState(() {
          _success = _editingCenterId != null 
              ? 'Training center settings updated successfully.' 
              : 'Physical training center configured successfully!';
        });
        _centerNameController.clear();
        _centerLatController.clear();
        _centerLonController.clear();
        _centerRadiusController.text = '150';
        _centerOpenTimeController.text = '09:30';
        _centerCloseTimeController.text = '17:30';
        _centerLateTimeController.text = '11:00';
        _editingCenterId = null;
        Navigator.of(context).pop(); // Dismiss sheet/dialog
        await _fetchCenters();
      } else {
        setState(() => _error = 'Failed to save training center config.');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleDeleteCenter(String centerId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Center'),
        content: const Text('Are you sure you want to delete this training center and clear all user mappings?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _loading = true;
      _error = '';
      _success = '';
    });

    try {
      final success = await _apiService.deleteGeoCenter(centerId);
      if (success) {
        setState(() => _success = 'Center deleted successfully.');
        await _fetchCenters();
        await _fetchStudents();
      } else {
        setState(() => _error = 'Failed to delete center.');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleAssignCenter(String? centerId) async {
    if (_selectedStudentIds.isEmpty) {
      setState(() => _error = 'Please select at least one student user.');
      return;
    }

    setState(() {
      _loading = true;
      _error = '';
      _success = '';
    });

    try {
      final success = await _apiService.assignGeoCenterBulk(
        _selectedStudentIds.toList(),
        centerId,
      );

      if (success != null) {
        setState(() {
          _success = 'Successfully mapped student assignments!';
          _selectedStudentIds.clear();
        });
        await _fetchStudents();
      } else {
        setState(() => _error = 'Failed to assign center.');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleCorrectRecord(String recordId) async {
    if (!_correctFormKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = '';
      _success = '';
    });
    try {
      final result = await _apiService.correctGeoRecord(
        recordId,
        _correctStatus,
        _correctReasonController.text.trim(),
      );
      if (result != null) {
        setState(() {
          _success = 'Attendance log updated with manual audit trail.';
        });
        _correctReasonController.clear();
        Navigator.of(context).pop();
        await _fetchRecords();
      } else {
        setState(() => _error = 'Failed to save correction.');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  // --- UI Builders ---

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).userProfile;
    if (user == null) {
      return const Center(child: Text('Authentication Profile Required.'));
    }

    final String role = user['role']?.toString().toLowerCase() ?? '';
    final bool isStudent = role == 'student';

    return DefaultTabController(
      length: isStudent ? 2 : (['head', 'associate'].contains(role) ? 3 : 1),
      child: Column(
        children: [
          // Sub-Tab Bar
          Container(
            color: Colors.white,
            child: TabBar(
              labelColor: Theme.of(context).primaryColor,
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: Theme.of(context).primaryColor,
              indicatorWeight: 3,
              tabs: isStudent
                  ? const [
                      Tab(icon: Icon(Icons.location_on_outlined), text: 'Mark Check-In'),
                      Tab(icon: Icon(Icons.history_toggle_off_rounded), text: 'My Logs'),
                    ]
                  : (['head', 'associate'].contains(role)
                      ? const [
                          Tab(icon: Icon(Icons.analytics_outlined), text: 'Logs'),
                          Tab(icon: Icon(Icons.domain_rounded), text: 'Centers'),
                          Tab(icon: Icon(Icons.people_outline_rounded), text: 'Assign'),
                        ]
                      : const [
                          Tab(icon: Icon(Icons.analytics_outlined), text: 'Logs'),
                        ]),
            ),
          ),

          // Feedback banners
          if (_error.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              color: Colors.red[50],
              child: Text(
                _error,
                style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          if (_success.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              color: Colors.green[50],
              child: Text(
                _success,
                style: const TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),

          Expanded(
            child: isStudent
                ? TabBarView(
                    children: [
                      _buildStudentCheckInTab(),
                      _buildHistoryLogsTab(isStudent: true),
                    ],
                  )
                : (['head', 'associate'].contains(role)
                    ? TabBarView(
                        children: [
                          _buildStaffLogsTab(),
                          _buildCentersConfigTab(),
                          _buildCenterAssignmentsTab(),
                        ],
                      )
                    : TabBarView(
                        children: [
                          _buildStaffLogsTab(),
                        ],
                      )),
          ),
        ],
      ),
    );
  }

  // --- TAB 1: Student Check-In View ---
  Widget _buildStudentCheckInTab() {
    if (_loading && _studentCenter == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_studentCenter == null) {
      return RefreshIndicator(
        onRefresh: _fetchStudentCenter,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 48),
              Icon(Icons.location_off_rounded, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              const Text(
                'No Center Assigned',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'You are not mapped to any training center yet. Please contact your coordinator or administrator to configure your geofence.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    final centerName = _studentCenter!['name'] ?? 'Assigned Center';
    final radius = (_studentCenter!['radius_meters'] as num?)?.toDouble() ?? 150.0;
    final openTime = _studentCenter!['open_time'] ?? '09:30';
    final closeTime = _studentCenter!['close_time'] ?? '17:30';
    final lateTime = _studentCenter!['late_time'] ?? '11:00';

    final isWithinRadius = _calculatedDistance != null && _calculatedDistance! <= radius;

    return RefreshIndicator(
      onRefresh: () async {
        await _fetchStudentCenter();
        await _fetchStudentHistory();
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Center info card
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey[200]!),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.business_rounded, color: Theme.of(context).primaryColor),
                        const SizedBox(width: 8),
                        Text(
                          centerName,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _buildInfoRow('Geofence Radius', '${radius.round()} meters'),
                    _buildInfoRow('Check-in Hours', '$openTime AM - $closeTime PM'),
                    _buildInfoRow('Late Threshold', 'After $lateTime AM'),
                    _buildInfoRow('Coordinates', 
                      '${(_studentCenter!['latitude'] as num).toStringAsFixed(5)}, ${(_studentCenter!['longitude'] as num).toStringAsFixed(5)}'
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Location card
            Card(
              elevation: 0,
              color: Colors.grey[50],
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    if (_currentPosition == null) ...[
                      Icon(Icons.gps_fixed_rounded, size: 48, color: Colors.grey[400]),
                      const SizedBox(height: 12),
                      const Text(
                        'Location details not verified yet',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'We need to determine your device\'s physical location to check boundaries.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ] else ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isWithinRadius ? Icons.verified_rounded : Icons.warning_amber_rounded,
                            color: isWithinRadius ? Colors.green : Colors.redAccent,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isWithinRadius ? 'Proximity verified' : 'Proximity verification failed',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isWithinRadius ? Colors.green : Colors.redAccent,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _calculatedDistance != null
                            ? 'Calculated distance: ${_calculatedDistance!.toStringAsFixed(1)}m'
                            : 'Checking distance...',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      Text(
                        'Allowed radius: ${radius.round()}m (GPS accuracy: +/-${_currentPosition!.accuracy.toStringAsFixed(1)}m)',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Coordinates: ${_currentPosition!.latitude.toStringAsFixed(5)}, ${_currentPosition!.longitude.toStringAsFixed(5)}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12, fontFamily: 'monospace'),
                      ),
                    ],
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _fetchingLocation ? null : _requestLocation,
                      icon: _fetchingLocation 
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.my_location_rounded),
                      label: Text(_fetchingLocation ? 'Fetching GPS...' : 'Verify Proximity & Location'),
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            if (_hasMarkedToday)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green[200]!),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: Colors.green),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Awesome! You have already checked in and marked attendance for today.',
                        style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              )
            else
              ElevatedButton(
                onPressed: (_currentPosition == null || _marking) ? null : _submitAttendance,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: Theme.of(context).primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _marking
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Submit Attendance Check-In',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                      ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  // --- TAB 2: History Logs / List ---
  Widget _buildHistoryLogsTab({required bool isStudent}) {
    final logs = isStudent ? _historyRecords : _filteredRecords;
    if (_loading && logs.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (logs.isEmpty) {
      return RefreshIndicator(
        onRefresh: isStudent ? _fetchStudentHistory : _fetchRecords,
        child: const SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(height: 48),
              Icon(Icons.history_toggle_off_rounded, size: 48, color: Colors.grey),
              SizedBox(height: 12),
              Text(
                'No Attendance Logs Found',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: isStudent ? _fetchStudentHistory : _fetchRecords,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: logs.length,
        itemBuilder: (context, index) {
          final record = logs[index];
          final date = record['date'] ?? '';
          final timeStr = record['marked_at'] != null 
              ? DateTime.parse(record['marked_at']).toLocal().toIso8601String().split('T')[1].substring(0, 5)
              : '';
          final status = (record['status'] ?? '').toString().toUpperCase();
          final centerName = record['center_name'] ?? 'Center';
          final distance = (record['distance'] as num?)?.toDouble() ?? 0.0;
          final isLate = status == 'LATE';

          return Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: Colors.grey[200]!),
            ),
            margin: const EdgeInsets.symmetric(vertical: 6),
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isLate ? Colors.orange[50] : Colors.green[50],
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: isLate ? Colors.orange[800] : Colors.green[800],
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
              title: Text(
                isStudent ? centerName : (record['student_name'] ?? 'Student'),
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded, size: 12, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(date, style: const TextStyle(fontSize: 11)),
                      const SizedBox(width: 12),
                      const Icon(Icons.access_time_rounded, size: 12, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(timeStr, style: const TextStyle(fontSize: 11)),
                    ],
                  ),
                  if (!isStudent) ...[
                    const SizedBox(height: 2),
                    Text('Center: $centerName (Distance: ${distance.toStringAsFixed(1)}m)', style: const TextStyle(fontSize: 11)),
                  ],
                ],
              ),
              trailing: isStudent 
                  ? Text('${distance.round()}m', style: TextStyle(color: Colors.grey[600], fontSize: 12))
                  : IconButton(
                      icon: const Icon(Icons.edit_note_rounded, color: Colors.blueAccent),
                      onPressed: () => _showCorrectionModal(record),
                    ),
            ),
          );
        },
      ),
    );
  }

  // --- TAB 3: Staff Logs View (Filters + List) ---
  Widget _buildStaffLogsTab() {
    return Column(
      children: [
        // Filter bar
        Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _selectedDate,
                          firstDate: DateTime(2026),
                          lastDate: DateTime.now(),
                        );
                        if (picked != null) {
                          setState(() => _selectedDate = picked);
                          await _fetchRecords();
                        }
                      },
                      icon: const Icon(Icons.date_range_rounded),
                      label: Text(_selectedDate.toIso8601String().split('T')[0]),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedFilterCenterId,
                      decoration: const InputDecoration(
                        isDense: true,
                        labelText: 'Center',
                        border: OutlineInputBorder(),
                      ),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('All Centers')),
                        ..._centers.map((c) => DropdownMenuItem(
                          value: c['id']?.toString(),
                          child: Text(c['name'] ?? ''),
                        )),
                      ],
                      onChanged: (val) async {
                        setState(() => _selectedFilterCenterId = val);
                        await _fetchRecords();
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedFilterBatchId,
                decoration: const InputDecoration(
                  isDense: true,
                  labelText: 'Batch Filter',
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem(value: null, child: Text('All Batches')),
                  ..._batches.map((b) => DropdownMenuItem(
                    value: b['id']?.toString(),
                    child: Text(b['batch_name'] ?? ''),
                  )),
                ],
                onChanged: (val) async {
                  setState(() => _selectedFilterBatchId = val);
                  await _fetchRecords();
                },
              ),
            ],
          ),
        ),
        
        Expanded(child: _buildHistoryLogsTab(isStudent: false)),
      ],
    );
  }

  // --- TAB 4: Centers Config List & Forms ---
  Widget _buildCentersConfigTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Physical Training Centers',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              ElevatedButton.icon(
                onPressed: () => _showCenterFormModal(null),
                icon: const Icon(Icons.add_location_alt_rounded),
                label: const Text('Add Center'),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: _centers.length,
            itemBuilder: (context, index) {
              final center = _centers[index];
              final id = center['id']?.toString() ?? '';
              final name = center['name'] ?? '';
              final lat = (center['latitude'] as num?)?.toDouble() ?? 0.0;
              final lon = (center['longitude'] as num?)?.toDouble() ?? 0.0;
              final radius = (center['radius_meters'] as num?)?.toDouble() ?? 150.0;
              final open = center['open_time'] ?? '09:30';
              final close = center['close_time'] ?? '17:30';

              return Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: BorderSide(color: Colors.grey[200]!),
                ),
                margin: const EdgeInsets.symmetric(vertical: 6),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit_rounded, color: Colors.blueAccent, size: 20),
                                onPressed: () => _showCenterFormModal(center),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_forever_rounded, color: Colors.redAccent, size: 20),
                                onPressed: () => _handleDeleteCenter(id),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('Coordinates: $lat, $lon', style: TextStyle(color: Colors.grey[700], fontSize: 12)),
                      Text('Boundary: ${radius.round()} meters radius', style: TextStyle(color: Colors.grey[700], fontSize: 12)),
                      Text('Operational Check-in: $open AM - $close PM', style: TextStyle(color: Colors.grey[700], fontSize: 12)),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // --- TAB 5: Assignments (Map student to center) ---
  Widget _buildCenterAssignmentsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  isDense: true,
                  labelText: 'Map Selected to Physical Center',
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Unassign / Clear Mappings')),
                  ..._centers.map((c) => DropdownMenuItem(
                    value: c['id']?.toString(),
                    child: Text(c['name'] ?? ''),
                  )),
                ],
                onChanged: (val) {
                  _handleAssignCenter(val);
                },
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Selected: ${_selectedStudentIds.length} users',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  if (_selectedStudentIds.isNotEmpty)
                    TextButton(
                      onPressed: () => setState(() => _selectedStudentIds.clear()),
                      child: const Text('Clear Selection'),
                    ),
                ],
              ),
            ],
          ),
        ),
        
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _students.length,
            itemBuilder: (context, index) {
              final student = _students[index];
              final id = student['id']?.toString() ?? '';
              final name = student['name'] ?? '';
              final email = student['email'] ?? '';
              final assignedCenterId = student['center_id'];
              
              final centerName = assignedCenterId != null
                  ? _centers.firstWhere((c) => c['id'] == assignedCenterId, orElse: () => const {})['name'] ?? 'Mapped Center'
                  : 'No Assigned Center';

              final isSelected = _selectedStudentIds.contains(id);

              return CheckboxListTile(
                value: isSelected,
                title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('$email\nCenter: $centerName', style: const TextStyle(fontSize: 12)),
                isThreeLine: true,
                onChanged: (val) {
                  setState(() {
                    if (val == true) {
                      _selectedStudentIds.add(id);
                    } else {
                      _selectedStudentIds.remove(id);
                    }
                  });
                },
              );
            },
          ),
        ),
      ],
    );
  }

  // --- MODALS / DIALOGS FOR FORMS ---

  void _showCenterFormModal(Map<String, dynamic>? center) {
    if (center != null) {
      _editingCenterId = center['id'];
      _centerNameController.text = center['name'] ?? '';
      _centerLatController.text = (center['latitude'] ?? '').toString();
      _centerLonController.text = (center['longitude'] ?? '').toString();
      _centerRadiusController.text = (center['radius_meters'] ?? '150').toString();
      _centerOpenTimeController.text = center['open_time'] ?? '09:30';
      _centerCloseTimeController.text = center['close_time'] ?? '17:30';
      _centerLateTimeController.text = center['late_time'] ?? '11:00';
    } else {
      _editingCenterId = null;
      _centerNameController.clear();
      _centerLatController.clear();
      _centerLonController.clear();
      _centerRadiusController.text = '150';
      _centerOpenTimeController.text = '09:30';
      _centerCloseTimeController.text = '17:30';
      _centerLateTimeController.text = '11:00';
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 24,
        ),
        child: SingleChildScrollView(
          child: Form(
            key: _centerFormKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _editingCenterId != null ? 'Edit Training Center' : 'Configure Training Center',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _centerNameController,
                  decoration: const InputDecoration(labelText: 'Center Name', border: OutlineInputBorder()),
                  validator: (val) => val == null || val.isEmpty ? 'Center name is required' : null,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _centerLatController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Latitude', border: OutlineInputBorder()),
                        validator: (val) {
                          if (val == null || val.isEmpty) return 'Required';
                          final n = double.tryParse(val);
                          if (n == null || n < -90.0 || n > 90.0) return 'Invalid';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _centerLonController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Longitude', border: OutlineInputBorder()),
                        validator: (val) {
                          if (val == null || val.isEmpty) return 'Required';
                          final n = double.tryParse(val);
                          if (n == null || n < -180.0 || n > 180.0) return 'Invalid';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _centerRadiusController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Geofence Radius (meters)', border: OutlineInputBorder()),
                  validator: (val) {
                    if (val == null || val.isEmpty) return 'Radius is required';
                    final n = double.tryParse(val);
                    if (n == null || n <= 0) return 'Must be greater than 0';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _centerOpenTimeController,
                        decoration: const InputDecoration(labelText: 'Open Time (HH:MM)', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _centerCloseTimeController,
                        decoration: const InputDecoration(labelText: 'Close Time (HH:MM)', border: OutlineInputBorder()),
                        validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _centerLateTimeController,
                  decoration: const InputDecoration(labelText: 'Late Time Threshold (HH:MM)', border: OutlineInputBorder()),
                  validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _handleSaveCenter,
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: Text(_editingCenterId != null ? 'Update Settings' : 'Create Center'),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showCorrectionModal(Map<String, dynamic> record) {
    _correctStatus = record['status'] == 'LATE' ? 'LATE' : 'PRESENT';
    _correctReasonController.clear();
    final recordId = record['id']?.toString() ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 24,
        ),
        child: Form(
          key: _correctFormKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Correct Attendance Status', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _correctStatus,
                decoration: const InputDecoration(labelText: 'Audit Status', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'PRESENT', child: Text('PRESENT')),
                  DropdownMenuItem(value: 'LATE', child: Text('LATE')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _correctStatus = val);
                  }
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _correctReasonController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Mandatory Reason for Correction',
                  border: OutlineInputBorder(),
                  hintText: 'Enter why you are changing the status...',
                ),
                validator: (val) => val == null || val.length < 5 ? 'Reason must be at least 5 characters long' : null,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => _handleCorrectRecord(recordId),
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                child: const Text('Save Audit Correction'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
