import 'package:flutter/material.dart';

class HomeTab extends StatelessWidget {
  final Map<String, dynamic>? userProfile;
  final Map<String, dynamic>? attendanceData;
  final Map<String, dynamic>? finesData;
  final List<dynamic> leadsList;
  final List<dynamic> eventsList;
  final Function(int) onNavigateToTab;
  final Future<void> Function() onRefreshHome;
  final bool isStudent;

  const HomeTab({
    super.key,
    required this.userProfile,
    required this.attendanceData,
    required this.finesData,
    required this.leadsList,
    required this.eventsList,
    required this.onNavigateToTab,
    required this.onRefreshHome,
    required this.isStudent,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final studentName = userProfile?['name'] ?? (isStudent ? 'Student' : 'User');
    final batchName = userProfile?['batch_id'] ?? 'General Batch';

    // Parse role info
    final rawRole = userProfile?['role']?.toString() ?? '';
    String displayRole = 'User';
    if (rawRole.toLowerCase() == 'head') {
      displayRole = 'Head Admin';
    } else if (rawRole.toLowerCase() == 'trainer') {
      displayRole = 'Trainer';
    } else if (rawRole.toLowerCase() == 'associate') {
      displayRole = 'Associate';
    } else if (rawRole.toLowerCase() == 'student') {
      displayRole = 'Student';
    } else if (rawRole.isNotEmpty) {
      displayRole = rawRole[0].toUpperCase() + rawRole.substring(1);
    }

    // Parse attendance stats
    final double dayPct = (attendanceData?['day_wise_attendance_pct'] as num?)?.toDouble() ?? 0.0;
    final double sessPct = (attendanceData?['session_wise_attendance_pct'] as num?)?.toDouble() ?? 0.0;
    final int totalDays = (attendanceData?['total_conducted_days'] as num?)?.toInt() ?? 0;
    final int attendedDays = (attendanceData?['attended_days'] as num?)?.toInt() ?? 0;

    // Parse library/fines stats
    final double totalFine = (finesData?['cumulative_fine'] as num?)?.toDouble() ?? 0.0;
    final List<dynamic> lendings = finesData?['lendings'] as List<dynamic>? ?? [];
    final activeLendingsCount = lendings.where((l) => l['status'] == 'lent' || l['status'] == 'overdue').length;

    return RefreshIndicator(
      onRefresh: onRefreshHome,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Greeting Card with Premium Gradient
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24.0),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.indigo, Colors.indigoAccent, Colors.blueAccent],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.indigo.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        child: Icon(isStudent ? Icons.school : Icons.admin_panel_settings_rounded, color: Colors.white, size: 32),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Welcome back,',
                              style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
                            ),
                            Text(
                              studentName,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white24, height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(isStudent ? 'ASSIGNED BATCH' : 'ROLE', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(isStudent ? batchName : displayRole, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          isStudent ? 'Active Student' : '$displayRole Portal',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      )
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            if (isStudent) ...[
              // Section: Academic Progress
              Text(
                'Academic Progress',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.grey[800]),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      context,
                      title: 'Day Attendance',
                      value: '${dayPct.toStringAsFixed(1)}%',
                      subtitle: '$attendedDays of $totalDays days',
                      progress: dayPct / 100,
                      progressColor: dayPct >= 75.0 ? Colors.green : Colors.orange,
                      icon: Icons.calendar_today,
                      onTap: () => onNavigateToTab(1), // Academics Tab
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      title: 'Session Attendance',
                      value: '${sessPct.toStringAsFixed(1)}%',
                      subtitle: 'Overall metrics',
                      progress: sessPct / 100,
                      progressColor: sessPct >= 75.0 ? Colors.indigo : Colors.orange,
                      icon: Icons.assessment,
                      onTap: () => onNavigateToTab(1), // Academics Tab
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Section: Library & Fines Summary
              Text(
                'Library Status',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.grey[800]),
              ),
              const SizedBox(height: 12),
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: InkWell(
                  onTap: () => onNavigateToTab(2), // Services Tab
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: totalFine > 0 ? Colors.red[50] : Colors.blueGrey[50],
                          child: Icon(
                            totalFine > 0 ? Icons.gavel_rounded : Icons.library_books_rounded,
                            color: totalFine > 0 ? Colors.red : Colors.blueGrey,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                activeLendingsCount > 0 
                                    ? '$activeLendingsCount Book(s) Checked Out' 
                                    : 'No Active Lendings',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                totalFine > 0 
                                    ? 'Outstanding Fines: ₹${totalFine.toStringAsFixed(2)}'
                                    : 'Good standing! No outstanding fines.',
                                style: TextStyle(
                                  color: totalFine > 0 ? Colors.red : Colors.grey[600],
                                  fontSize: 13,
                                  fontWeight: totalFine > 0 ? FontWeight.w600 : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
              ),
            ] else ...[
              // Section: Admin Stat Grid & Notice
              Text(
                'Academy Overview',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.grey[800]),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      context,
                      title: 'Active Leads',
                      value: '${leadsList.length}',
                      subtitle: 'Placement postings',
                      progress: 1.0,
                      progressColor: Colors.green,
                      icon: Icons.work_outline_rounded,
                      onTap: () => onNavigateToTab(2), // Opportunities Tab
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      title: 'Calendar Events',
                      value: '${eventsList.length}',
                      subtitle: 'Scheduled sessions',
                      progress: 1.0,
                      progressColor: Colors.purple,
                      icon: Icons.event_note_rounded,
                      onTap: () => onNavigateToTab(2), // Opportunities Tab
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: Colors.indigo[50],
                        child: const Icon(Icons.computer_rounded, color: Colors.indigo),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Administrative Web Portal',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Full tools for batch enrollment, attendance submissions, and library returns are available on the desktop site.',
                              style: TextStyle(color: Colors.grey[600], fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Section: Quick Updates (Leads & Events)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Latest Opportunities & Events',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.grey[800]),
                ),
                TextButton(
                  onPressed: () => onNavigateToTab(isStudent ? 3 : 2), // Opportunities/Events tab
                  child: const Text('View All'),
                )
              ],
            ),
            const SizedBox(height: 8),
            _buildUpcomingRow(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required String subtitle,
    required double progress,
    required Color progressColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(icon, color: Colors.grey[600], size: 20),
                  SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      value: progress.isFinite && progress >= 0 ? progress : 0.0,
                      strokeWidth: 4,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                value,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                title,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(color: Colors.grey[500], fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUpcomingRow(BuildContext context) {
    // Show one lead or one event if available, else a placeholder
    final bool hasLead = leadsList.isNotEmpty;
    final bool hasEvent = eventsList.isNotEmpty;

    if (!hasLead && !hasEvent) {
      return Card(
        elevation: 0,
        color: Colors.grey[100],
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: const Padding(
          padding: EdgeInsets.all(20.0),
          child: Center(
            child: Text(
              'No new opportunities or events at the moment.',
              style: TextStyle(color: Colors.grey),
            ),
          ),
        ),
      );
    }

    return Column(
      children: [
        if (hasLead) ...[
          _buildQuickOpportunityCard(context, leadsList.first, isLead: true),
          const SizedBox(height: 10),
        ],
        if (hasEvent) ...[
          _buildQuickOpportunityCard(context, eventsList.first, isLead: false),
        ],
      ],
    );
  }

  Widget _buildQuickOpportunityCard(BuildContext context, dynamic item, {required bool isLead}) {
    final title = isLead ? (item['role'] ?? 'Job Opening') : (item['name'] ?? 'Upcoming Event');
    final subtitle = isLead ? (item['company_name'] ?? 'Company') : (item['description'] ?? 'Event description');
    final trailingText = isLead 
        ? 'Salary: ${item['package'] ?? 'N/A'}' 
        : 'Date: ${(item['date'] as String?)?.split('T')[0] ?? ''}';

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        onTap: () => onNavigateToTab(isStudent ? 3 : 2),
        leading: CircleAvatar(
          backgroundColor: isLead ? Colors.green[50] : Colors.purple[50],
          child: Icon(
            isLead ? Icons.work_rounded : Icons.event_rounded,
            color: isLead ? Colors.green : Colors.purple,
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          subtitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              trailingText,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.indigo),
            ),
            const SizedBox(height: 4),
            const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
