import 'package:flutter/material.dart';

class ServicesTab extends StatelessWidget {
  final Map<String, dynamic>? finesData;
  final Map<String, dynamic>? myResume;
  final bool loadingResume;
  final bool loadingFines;
  final Future<void> Function() onRefreshFines;
  final Future<void> Function() onRefreshResume;
  final Future<void> Function() onUploadResume;
  final Future<void> Function() onDownloadResume;

  const ServicesTab({
    super.key,
    required this.finesData,
    required this.myResume,
    required this.loadingResume,
    required this.loadingFines,
    required this.onRefreshFines,
    required this.onRefreshResume,
    required this.onUploadResume,
    required this.onDownloadResume,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          // Sub-Tab Bar
          Container(
            color: Colors.white,
            child: TabBar(
              labelColor: theme.primaryColor,
              unselectedLabelColor: Colors.grey[600],
              indicatorColor: theme.primaryColor,
              indicatorWeight: 3,
              tabs: const [
                Tab(
                  icon: Icon(Icons.library_books_rounded),
                  text: 'Library Portal',
                ),
                Tab(
                  icon: Icon(Icons.contact_page_rounded),
                  text: 'Resume Portal',
                ),
              ],
            ),
          ),
          
          // Tab Views
          Expanded(
            child: TabBarView(
              children: [
                // TAB 1: LIBRARY PORTAL
                _buildLibraryPortal(context),

                // TAB 2: RESUME PORTAL
                _buildResumePortal(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLibraryPortal(BuildContext context) {
    final double cumulativeFine = (finesData?['cumulative_fine'] as num?)?.toDouble() ?? 0.0;
    final List<dynamic> lendings = finesData?['lendings'] as List<dynamic>? ?? [];

    return RefreshIndicator(
      onRefresh: onRefreshFines,
      child: loadingFines
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Fine Summary Card
                  Card(
                    color: cumulativeFine > 0 ? Colors.red[50] : Colors.green[50],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: cumulativeFine > 0 ? Colors.redAccent.withOpacity(0.3) : Colors.green.withOpacity(0.3),
                      ),
                    ),
                    elevation: 0,
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          Icon(
                            cumulativeFine > 0 ? Icons.warning_amber_rounded : Icons.check_circle_rounded,
                            color: cumulativeFine > 0 ? Colors.red : Colors.green,
                            size: 40,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Outstanding Fine Balance',
                            style: TextStyle(
                              color: cumulativeFine > 0 ? Colors.red[900] : Colors.green[900],
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '₹${cumulativeFine.toStringAsFixed(2)}',
                            style: TextStyle(
                              color: cumulativeFine > 0 ? Colors.red[900] : Colors.green[900],
                              fontWeight: FontWeight.bold,
                              fontSize: 32,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            cumulativeFine > 0
                                ? 'Please return overdue books and clear your dues at the counter.'
                                : 'No pending dues. You are in good standing!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: cumulativeFine > 0 ? Colors.red[700] : Colors.green[700],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Lendings List Header
                  Text(
                    'Lending Transactions (${lendings.length})',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 12),

                  if (lendings.isEmpty)
                    Card(
                      elevation: 0,
                      color: Colors.grey[100],
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Center(
                          child: Column(
                            children: [
                              Icon(Icons.menu_book_rounded, color: Colors.grey, size: 48),
                              SizedBox(height: 12),
                              Text(
                                'You haven\'t borrowed any books yet.',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: lendings.length,
                      itemBuilder: (context, index) {
                        final lending = lendings[index];
                        final bookTitle = lending['book_title'] ?? 'Book Title';
                        final copyId = lending['copy_id'] ?? 'N/A';
                        final status = lending['status'] ?? 'lent';
                        final fine = (lending['fine_amount'] as num?)?.toDouble() ?? 0.0;
                        
                        final lendDate = lending['lend_date'] != null 
                            ? lending['lend_date'].split('T')[0] 
                            : 'N/A';
                        final dueDate = lending['due_date'] != null 
                            ? lending['due_date'].split('T')[0] 
                            : 'N/A';
                        final returnDate = lending['return_date'] != null 
                            ? lending['return_date'].split('T')[0] 
                            : null;

                        Color statusColor = Colors.blue;
                        String statusLabel = 'Lent';
                        if (status.toString().toLowerCase() == 'overdue') {
                          statusColor = Colors.red;
                          statusLabel = 'Overdue';
                        } else if (status.toString().toLowerCase() == 'returned') {
                          statusColor = Colors.green;
                          statusLabel = 'Returned';
                        }

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
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            bookTitle,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Copy ID: $copyId',
                                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: statusColor.withOpacity(0.3)),
                                      ),
                                      child: Text(
                                        statusLabel,
                                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 20),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildDateInfo('Lent Date', lendDate),
                                    _buildDateInfo(statusLabel == 'Returned' ? 'Returned Date' : 'Due Date', 
                                        returnDate ?? dueDate, 
                                        highlight: statusLabel == 'Overdue'),
                                    if (fine > 0)
                                      _buildFineInfo('Fine', '₹${fine.toStringAsFixed(2)}'),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildDateInfo(String label, String date, {bool highlight = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.grey[500], fontSize: 11),
        ),
        const SizedBox(height: 2),
        Text(
          date,
          style: TextStyle(
            fontWeight: FontWeight.w600, 
            fontSize: 13,
            color: highlight ? Colors.red : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildFineInfo(String label, String fine) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.red[300], fontSize: 11),
        ),
        const SizedBox(height: 2),
        Text(
          fine,
          style: const TextStyle(
            fontWeight: FontWeight.bold, 
            fontSize: 13,
            color: Colors.red,
          ),
        ),
      ],
    );
  }

  Widget _buildResumePortal(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefreshResume,
      child: loadingResume
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.contact_page_rounded, size: 80, color: Colors.blueGrey),
                  const SizedBox(height: 16),
                  const Text(
                    'Student Resume Portal',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Upload and view your active resume PDF for head admin and trainers review.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 32),
                  
                  if (myResume == null) ...[
                    Card(
                      color: Colors.amber.withOpacity(0.1),
                      elevation: 0,
                      margin: const EdgeInsets.only(bottom: 24),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        side: BorderSide(color: Colors.amber.withOpacity(0.3)),
                      ),
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber_rounded, color: Colors.amber),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'No resume uploaded yet. Click upload below to attach your PDF resume.',
                                style: TextStyle(color: Colors.black87, fontSize: 13),
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  ] else ...[
                    Card(
                      elevation: 4,
                      margin: const EdgeInsets.only(bottom: 24),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.check_circle_rounded, color: Colors.green),
                                SizedBox(width: 8),
                                Text(
                                  'Active Resume Attached',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                                ),
                              ],
                            ),
                            const Divider(height: 24),
                            Text(
                              'Filename: ${myResume!['filename']}',
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Uploaded: ${myResume!['uploaded_at']?.split('T')[0] ?? ''}',
                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                            ),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              onPressed: onDownloadResume,
                              icon: const Icon(Icons.download_rounded),
                              label: const Text('VIEW / DOWNLOAD RESUME'),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size.fromHeight(48),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  
                  ElevatedButton.icon(
                    onPressed: onUploadResume,
                    icon: const Icon(Icons.upload_file_rounded),
                    label: Text(myResume == null ? 'UPLOAD PDF RESUME' : 'REPLACE PDF RESUME'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
