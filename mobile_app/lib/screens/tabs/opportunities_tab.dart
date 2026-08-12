import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class OpportunitiesTab extends StatefulWidget {
  final List<dynamic> leadsList;
  final List<dynamic> eventsList;
  final bool loadingLeads;
  final bool loadingEvents;
  final Future<void> Function() onRefreshLeads;
  final Future<void> Function() onRefreshEvents;

  const OpportunitiesTab({
    super.key,
    required this.leadsList,
    required this.eventsList,
    required this.loadingLeads,
    required this.loadingEvents,
    required this.onRefreshLeads,
    required this.onRefreshEvents,
  });

  @override
  State<OpportunitiesTab> createState() => _OpportunitiesTabState();
}

class _OpportunitiesTabState extends State<OpportunitiesTab> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

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
                  icon: Icon(Icons.work_outline_rounded),
                  text: 'Placement Leads',
                ),
                Tab(
                  icon: Icon(Icons.event_outlined),
                  text: 'Events & Calendar',
                ),
              ],
            ),
          ),
          
          // Tab Views
          Expanded(
            child: TabBarView(
              children: [
                // TAB 1: PLACEMENT LEADS
                _buildPlacementLeads(context),

                // TAB 2: EVENTS & CALENDAR
                _buildEventsCalendar(context),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlacementLeads(BuildContext context) {
    // Filter leads based on query
    final filteredLeads = widget.leadsList.where((lead) {
      final company = (lead['company_name'] ?? '').toString().toLowerCase();
      final role = (lead['role'] ?? '').toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      return company.contains(query) || role.contains(query);
    }).toList();

    return RefreshIndicator(
      onRefresh: widget.onRefreshLeads,
      child: widget.loadingLeads
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search Bar
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by role or company...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded),
                              onPressed: () {
                                setState(() {
                                  _searchController.clear();
                                  _searchQuery = '';
                                });
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    ),
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val.trim();
                      });
                    },
                  ),
                ),
                
                // Leads List
                Expanded(
                  child: filteredLeads.isEmpty
                      ? ListView(
                          children: [
                            const SizedBox(height: 100),
                            Center(
                              child: Column(
                                children: [
                                  Icon(Icons.work_off_rounded, size: 48, color: Colors.grey[400]),
                                  const SizedBox(height: 12),
                                  Text(
                                    _searchQuery.isEmpty 
                                        ? 'No placement leads available.' 
                                        : 'No leads matching "$_searchQuery"',
                                    style: const TextStyle(color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          itemCount: filteredLeads.length,
                          itemBuilder: (context, index) {
                            final lead = filteredLeads[index];
                            final company = lead['company_name'] ?? 'Company';
                            final role = lead['role'] ?? 'Job Role';
                            final package = lead['package'] ?? 'N/A';
                            final lastDate = lead['last_date'] ?? 'N/A';
                            final link = lead['link_to_apply'] ?? '';
                            final hrName = lead['hr_name'] ?? 'N/A';
                            final hrEmail = lead['email'] ?? '';
                            final hrPhone = lead['number'] ?? '';

                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Header
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                role,
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: Colors.indigo),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                company,
                                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.grey[800]),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.green[50],
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            package,
                                            style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const Divider(height: 24),
                                    
                                    // Metadata
                                    Row(
                                      children: [
                                        Icon(Icons.calendar_today_rounded, size: 14, color: Colors.grey[600]),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Apply Before: $lastDate',
                                          style: TextStyle(color: Colors.grey[600], fontSize: 13),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    
                                    // HR details box
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.grey[50],
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.grey[200]!),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'HR Contact Details',
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey[700]),
                                          ),
                                          const SizedBox(height: 6),
                                          Text('Name: $hrName', style: const TextStyle(fontSize: 13)),
                                          if (hrEmail.isNotEmpty)
                                            GestureDetector(
                                              onTap: () => _copyToClipboard(context, hrEmail, 'Email Address'),
                                              child: Row(
                                                children: [
                                                  const Text('Email: ', style: TextStyle(fontSize: 13)),
                                                  Text(hrEmail, style: const TextStyle(fontSize: 13, color: Colors.indigo, decoration: TextDecoration.underline)),
                                                  const SizedBox(width: 4),
                                                  const Icon(Icons.copy_rounded, size: 12, color: Colors.indigo),
                                                ],
                                              ),
                                            ),
                                          if (hrPhone.isNotEmpty)
                                            GestureDetector(
                                              onTap: () => _copyToClipboard(context, hrPhone, 'Phone Number'),
                                              child: Row(
                                                children: [
                                                  const Text('Phone: ', style: TextStyle(fontSize: 13)),
                                                  Text(hrPhone, style: const TextStyle(fontSize: 13, color: Colors.indigo, decoration: TextDecoration.underline)),
                                                  const SizedBox(width: 4),
                                                  const Icon(Icons.copy_rounded, size: 12, color: Colors.indigo),
                                                ],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    
                                    // Action buttons
                                    if (link.isNotEmpty)
                                      ElevatedButton.icon(
                                        onPressed: () => _copyToClipboard(context, link, 'Apply Link'),
                                        icon: const Icon(Icons.copy_all_rounded, size: 18),
                                        label: const Text('COPY APPLICATION LINK'),
                                        style: ElevatedButton.styleFrom(
                                          minimumSize: const Size.fromHeight(42),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildEventsCalendar(BuildContext context) {
    return RefreshIndicator(
      onRefresh: widget.onRefreshEvents,
      child: widget.loadingEvents
          ? const Center(child: CircularProgressIndicator())
          : widget.eventsList.isEmpty
              ? ListView(
                  children: [
                    const SizedBox(height: 100),
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.event_busy_rounded, size: 48, color: Colors.grey[400]),
                          const SizedBox(height: 12),
                          const Text(
                            'No scheduled events found.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: widget.eventsList.length,
                  itemBuilder: (context, index) {
                    final event = widget.eventsList[index];
                    final name = event['name'] ?? 'Event Name';
                    final desc = event['description'] ?? 'No description provided';
                    final formLink = event['form_link'] ?? '';
                    
                    // Parse Date
                    final rawDate = event['date'] as String?;
                    String day = '??';
                    String month = 'EVT';
                    String year = '';
                    if (rawDate != null) {
                      try {
                        final parsedDate = DateTime.parse(rawDate);
                        day = parsedDate.day.toString();
                        year = parsedDate.year.toString();
                        month = _getMonthAbbreviation(parsedDate.month);
                      } catch (_) {}
                    }

                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Premium Date Widget (Calendar look)
                            Container(
                              width: 60,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.purple[50],
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.purple.withOpacity(0.2)),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    month,
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.purple, fontSize: 11),
                                  ),
                                  Text(
                                    day,
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.purple, fontSize: 22),
                                  ),
                                  if (year.isNotEmpty)
                                    Text(
                                      year,
                                      style: TextStyle(color: Colors.purple.withOpacity(0.7), fontSize: 9),
                                    ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            
                            // Event Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.purple),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    desc,
                                    style: TextStyle(color: Colors.grey[800], fontSize: 13),
                                  ),
                                  if (formLink.isNotEmpty) ...[
                                    const SizedBox(height: 14),
                                    OutlinedButton.icon(
                                      onPressed: () => _copyToClipboard(context, formLink, 'Registration Link'),
                                      icon: const Icon(Icons.copy_rounded, size: 14),
                                      label: const Text('COPY REGISTRATION LINK', style: TextStyle(fontSize: 11)),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  String _getMonthAbbreviation(int monthNum) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    if (monthNum >= 1 && monthNum <= 12) {
      return months[monthNum - 1];
    }
    return 'EVT';
  }

  void _copyToClipboard(BuildContext context, String text, String type) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$type copied to clipboard!'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
