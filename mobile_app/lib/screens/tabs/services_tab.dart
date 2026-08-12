import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../services/api_service.dart';
import 'dart:convert';

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
      length: 3,
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
                Tab(
                  icon: Icon(Icons.auto_awesome_rounded),
                  text: 'AI Career Suite',
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

                // TAB 3: AI CAREER SUITE
                _buildAICareerSuite(context),
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

  Widget _buildAICareerSuite(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  const Icon(Icons.auto_awesome_rounded, size: 50, color: Colors.indigo),
                  const SizedBox(height: 10),
                  const Text(
                    'AI Placement & Career Assistant',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Access resume optimizations and career chatbot guidance.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          _buildSuiteLinkCard(
            context,
            title: 'ATS Resume Audit Tool',
            subtitle: 'Run agentic analysis against target Job Descriptions.',
            icon: Icons.flash_on_rounded,
            color: Colors.amber,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ATSAnalyzerScreen()),
              );
            },
          ),
          const SizedBox(height: 12),
          _buildSuiteLinkCard(
            context,
            title: 'AI Career Coach Chat',
            subtitle: 'Ask about local courses, guides, and career tracks.',
            icon: Icons.chat_rounded,
            color: Colors.blue,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AICareerCoachScreen()),
              );
            },
          ),
          const SizedBox(height: 12),
          _buildSuiteLinkCard(
            context,
            title: 'AI Provider Settings',
            subtitle: 'Configure your active LLM API credentials.',
            icon: Icons.settings_rounded,
            color: Colors.grey,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const LLMKeysScreen()),
              );
            },
          ),
          const SizedBox(height: 12),
          _buildSuiteLinkCard(
            context,
            title: 'Weekly Test Center',
            subtitle: 'Take interactive weekly exams and review results.',
            icon: Icons.assignment_rounded,
            color: Colors.purple,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const WeeklyTestsScreen()),
              );
            },
          ),
          const SizedBox(height: 30),
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: Text(
                'Note: Interactive Mock Interviews and LaTeX Resume Builder are available on the Academy Web Administrative Portal.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 11, fontStyle: FontStyle.italic),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuiteLinkCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
        onTap: onTap,
      ),
    );
  }
}

// --- Supporting Screens in Mobile App ---

class LLMKeysScreen extends StatefulWidget {
  const LLMKeysScreen({super.key});

  @override
  State<LLMKeysScreen> createState() => _LLMKeysScreenState();
}

class _LLMKeysScreenState extends State<LLMKeysScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  
  String _provider = 'gemini';
  final TextEditingController _keyCtrl = TextEditingController();
  
  bool _loading = true;
  bool _saving = false;
  Map<String, dynamic>? _savedConfig;

  @override
  void initState() {
    super.initState();
    _fetchConfig();
  }

  Future<void> _fetchConfig() async {
    setState(() => _loading = true);
    final data = await _apiService.getLLMConfig();
    if (data != null) {
      _savedConfig = data;
      if (data['active_provider'] != null) {
        _provider = data['active_provider'];
        final savedProviders = data['saved_providers'] as Map<String, dynamic>;
        _keyCtrl.text = savedProviders[_provider] ?? '';
      }
    }
    setState(() => _loading = false);
  }

  Future<void> _saveConfig() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final success = await _apiService.saveLLMConfig(_provider, _keyCtrl.text);
    setState(() => _saving = false);

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('AI settings saved successfully!'), backgroundColor: Colors.green),
      );
      _fetchConfig();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save settings. Please verify the key.'), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Credentials')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'AI Provider Settings',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Provide your own LLM API keys. Prompt optimizations run dynamically on the server using your personal credentials.',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                    const SizedBox(height: 24),
                    DropdownButtonFormField<String>(
                      value: _provider,
                      decoration: const InputDecoration(
                        labelText: 'Active Provider',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'gemini', child: Text('Google Gemini (gemini-1.5-flash)')),
                        DropdownMenuItem(value: 'groq', child: Text('Groq AI (llama-3.3-70b-versatile)')),
                        DropdownMenuItem(value: 'mistral', child: Text('Mistral AI (mistral-small-latest)')),
                        DropdownMenuItem(value: 'openai', child: Text('OpenAI (gpt-4o-mini)')),
                      ],
                      onChanged: (val) {
                        if (val == null) return;
                        setState(() {
                          _provider = val;
                          final saved = _savedConfig?['saved_providers'] as Map<String, dynamic>?;
                          _keyCtrl.text = saved?[_provider] ?? '';
                        });
                      },
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _keyCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'API Key',
                        border: OutlineInputBorder(),
                        helperText: 'API Key is masked (e.g. ****abcd) for security.',
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Key is required' : null,
                    ),
                    const SizedBox(height: 30),
                    ElevatedButton(
                      onPressed: _saving ? null : _saveConfig,
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: Text(_saving ? 'Saving...' : 'SAVE SETTINGS'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class ATSAnalyzerScreen extends StatefulWidget {
  const ATSAnalyzerScreen({super.key});

  @override
  State<ATSAnalyzerScreen> createState() => _ATSAnalyzerScreenState();
}

class _ATSAnalyzerScreenState extends State<ATSAnalyzerScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _jdCtrl = TextEditingController();
  
  bool _analyzing = false;
  Map<String, dynamic>? _results;
  String? _error;
  String? _customFilePath;

  Future<void> _pickResume() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (result != null && result.files.single.path != null) {
        setState(() {
          _customFilePath = result.files.single.path;
        });
      }
    } catch (e) {
      print('Pick resume error: $e');
    }
  }

  Future<void> _runAudit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _analyzing = true;
      _error = null;
      _results = null;
    });

    final data = await _apiService.analyzeATS(
      _jdCtrl.text,
      filePath: _customFilePath,
    );

    setState(() => _analyzing = false);

    if (data == null) {
      setState(() {
        _error = 'Analysis failed. Make sure your active LLM API Key is configured correctly in AI settings.';
      });
    } else {
      setState(() {
        _results = data;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ATS Resume Auditor')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_results == null) ...[
                const Text(
                  'Audit Resume Matching',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Paste job details to run multi-agent checks on your matching score.',
                  style: TextStyle(color: Colors.grey, fontSize: 13),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _jdCtrl,
                  maxLines: 8,
                  decoration: const InputDecoration(
                    labelText: 'Target Job Description',
                    alignLabelWithHint: true,
                    border: OutlineInputBorder(),
                    hintText: 'Paste Job description here...',
                  ),
                  validator: (val) => val == null || val.isEmpty ? 'Job Description is required' : null,
                ),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Upload custom resume file (Optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: Text(_customFilePath != null ? _customFilePath!.split('/').last : 'Uses saved resume builder profile by default'),
                  trailing: ElevatedButton(
                    onPressed: _pickResume,
                    child: const Text('Select PDF'),
                  ),
                ),
                const SizedBox(height: 24),
                if (_error != null) ...[
                  Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                  const SizedBox(height: 16),
                ],
                ElevatedButton(
                  onPressed: _analyzing ? null : _runAudit,
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: Text(_analyzing ? 'Auditing Resume...' : 'RUN ATS AUDIT'),
                ),
              ] else ...[
                // Renders Results report
                _buildResultsReport(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultsReport() {
    final score = _results!['score'] ?? 0;
    final matchKws = _results!['matching_keywords'] as List<dynamic>? ?? [];
    final missKws = _results!['missing_keywords'] as List<dynamic>? ?? [];
    final ragRecs = _results!['rag_recommendations'] as List<dynamic>? ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 32,
              backgroundColor: score >= 70 ? Colors.green[50] : Colors.amber[50],
              child: Text(
                '$score%',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: score >= 70 ? Colors.green : Colors.amber[900],
                ),
              ),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ATS Matching Report', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('Weights: Skills (40%), Experience (30%), Formatting (30%)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        
        // Explainable AI report block
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('💡 Explainable AI Analysis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.indigo)),
              const SizedBox(height: 6),
              Text(_results!['explanation'] ?? '', style: const TextStyle(fontSize: 13, height: 1.4)),
            ],
          ),
        ),
        const SizedBox(height: 20),

        const Text('Keyword Matching Split', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(10),
                color: Colors.green[50],
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Matching (${matchKws.length})', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                    const SizedBox(height: 6),
                    Text(matchKws.join(', '), style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(10),
                color: Colors.red[50],
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Missing (${missKws.length})', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                    const SizedBox(height: 6),
                    Text(missKws.join(', '), style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // RAG course suggestions
        const Text('📖 Local Learning Recommendations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 10),
        if (ragRecs.isEmpty)
          const Text('No direct matched academy notes or batches found.', style: TextStyle(color: Colors.grey, fontSize: 12))
        else
          ...ragRecs.map((rec) {
            final type = rec['type']?.toString().toUpperCase() ?? '';
            final title = rec['title'] ?? '';
            final desc = rec['description'] ?? '';
            return Card(
              margin: const EdgeInsets.symmetric(vertical: 4),
              child: ListTile(
                title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                subtitle: Text(desc, style: const TextStyle(fontSize: 12)),
                leading: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: Colors.indigo[50], borderRadius: BorderRadius.circular(4)),
                  child: Text(type, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.indigo)),
                ),
              ),
            );
          }),
          
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () {
            setState(() {
              _results = null;
              _jdCtrl.clear();
              _customFilePath = null;
            });
          },
          child: const Text('BACK TO AUDITOR'),
        ),
      ],
    );
  }
}

class AICareerCoachScreen extends StatefulWidget {
  const AICareerCoachScreen({super.key});

  @override
  State<AICareerCoachScreen> createState() => _AICareerCoachScreenState();
}

class _AICareerCoachScreenState extends State<AICareerCoachScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  
  final List<Map<String, dynamic>> _messages = [
    {
      'role': 'coach',
      'content': "Hi! I'm your AI Career Coach. Ask me how to map out a placement track, borrow library reference books, or registers for batch openings!"
    }
  ];
  bool _loading = false;

  Future<void> _sendMessage() async {
    if (_msgCtrl.text.trim().isEmpty || _loading) return;
    final messageText = _msgCtrl.text.trim();
    _msgCtrl.clear();

    setState(() {
      _messages.add({'role': 'user', 'content': messageText});
      _loading = true;
    });
    
    _scrollToBottom();

    // Map history for RAG backend format
    final history = _messages
        .skip(1) // skip introduction
        .take(_messages.length - 2) // skip current user prompt
        .map((m) => {
              'role': m['role'] == 'user' ? 'user' : 'assistant',
              'content': m['content'],
            })
        .toList();

    final data = await _apiService.chatWithCoach(messageText, history);
    
    setState(() => _loading = false);

    if (data != null) {
      setState(() {
        _messages.add({
          'role': 'coach',
          'content': data['response'],
          'rag': data['rag_context'],
        });
      });
      _scrollToBottom();
    } else {
      setState(() {
        _messages.add({
          'role': 'coach',
          'content': 'Failed to compile coach response. Verify your AI Settings key is valid.',
        });
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Career Coach')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isCoach = msg['role'] == 'coach';
                final rag = msg['rag'] as List<dynamic>?;
                
                return Column(
                  crossAxisAlignment: isCoach ? CrossAxisAlignment.start : CrossAxisAlignment.end,
                  children: [
                    Container(
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isCoach ? Colors.grey[200] : Colors.indigo[100],
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(12),
                          topRight: const Radius.circular(12),
                          bottomLeft: isCoach ? const Radius.circular(2) : const Radius.circular(12),
                          bottomRight: isCoach ? const Radius.circular(12) : const Radius.circular(2),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isCoach ? 'Career Coach' : 'You',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isCoach ? Colors.indigo : Colors.blue[900],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(msg['content'] ?? '', style: const TextStyle(fontSize: 14)),
                        ],
                      ),
                    ),
                    if (rag != null && rag.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.only(left: 4, bottom: 8),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: rag.map((rec) {
                            final type = rec['type']?.toString().toUpperCase() ?? 'INFO';
                            final title = rec['title'] ?? '';
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                border: Border.all(color: Colors.grey[300]!),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '[$type] $title',
                                style: const TextStyle(fontSize: 10, color: Colors.indigo, fontWeight: FontWeight.bold),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Text('Coach is researching course catalogs...', style: TextStyle(color: Colors.grey, fontSize: 12, fontStyle: FontStyle.italic)),
            ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Colors.grey[300]!))),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Ask advice (e.g. recommend books)...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 10),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: Colors.indigo),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class WeeklyTestsScreen extends StatefulWidget {
  const WeeklyTestsScreen({super.key});

  @override
  State<WeeklyTestsScreen> createState() => _WeeklyTestsScreenState();
}

class _WeeklyTestsScreenState extends State<WeeklyTestsScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _tests = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchTests();
  }

  Future<void> _fetchTests() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final data = await _apiService.listTests();
    setState(() {
      _tests = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Weekly Tests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchTests,
          )
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _tests.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.assignment_turned_in_rounded, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No weekly tests published yet.', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _tests.length,
                  itemBuilder: (context, index) {
                    final test = _tests[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              test['title'] ?? 'Weekly Test',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              test['topic'] ?? '',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.grey[600], fontSize: 12),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Questions: ${test['num_questions']} | Marks/Q: ${test['marks_per_question']}',
                                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => TakeTestScreen(
                                          testId: test['id'],
                                          title: test['title'] ?? 'Weekly Test',
                                          topic: test['topic'] ?? '',
                                          marksPerQuestion: test['marks_per_question'] ?? 1,
                                        ),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  ),
                                  child: const Text('Start Test', style: TextStyle(fontSize: 12)),
                                ),
                              ],
                            )
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class TakeTestScreen extends StatefulWidget {
  final String testId;
  final String title;
  final String topic;
  final int marksPerQuestion;

  const TakeTestScreen({
    super.key,
    required this.testId,
    required this.title,
    required this.topic,
    required this.marksPerQuestion,
  });

  @override
  State<TakeTestScreen> createState() => _TakeTestScreenState();
}

class _TakeTestScreenState extends State<TakeTestScreen> {
  final ApiService _apiService = ApiService();
  bool _loading = true;
  bool _submitting = false;
  Map<String, dynamic>? _testDetails;
  final Map<String, int> _selectedAnswers = {};
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTest();
  }

  Future<void> _loadTest() async {
    setState(() => _loading = true);
    final data = await _apiService.getTestDetails(widget.testId);
    setState(() {
      _testDetails = data;
      _loading = false;
    });
  }

  Future<void> _submitAnswers() async {
    final questions = _testDetails?['questions'] as List<dynamic>? ?? [];
    if (_selectedAnswers.length < questions.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please answer all questions before submitting.')),
      );
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    final result = await _apiService.submitTestAnswers(widget.testId, _selectedAnswers);
    setState(() => _submitting = false);

    if (result == null) {
      setState(() {
        _error = 'Failed to submit answers. Please check your network connection.';
      });
    } else {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => TestGradedScreen(
            title: widget.title,
            result: result,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final questions = _testDetails?['questions'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: questions.length,
                    itemBuilder: (context, index) {
                      final q = questions[index];
                      final qIndexStr = q['question_index'].toString();
                      final options = q['options'] as List<dynamic>? ?? [];
                      final selectedIdx = _selectedAnswers[qIndexStr];

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${index + 1}. ${q['question_text'] ?? ''}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 12),
                              ...List.generate(options.length, (optIdx) {
                                final optionText = options[optIdx].toString();
                                final isSelected = selectedIdx == optIdx;
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: () {
                                      setState(() {
                                        _selectedAnswers[qIndexStr] = optIdx;
                                      });
                                    },
                                    style: OutlinedButton.styleFrom(
                                      alignment: Alignment.centerLeft,
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      side: BorderSide(
                                        color: isSelected ? Colors.indigo : Colors.grey[300]!,
                                        width: isSelected ? 2 : 1,
                                      ),
                                      backgroundColor: isSelected ? Colors.indigo.withOpacity(0.05) : Colors.transparent,
                                    ),
                                    child: Text(
                                      optionText,
                                      style: TextStyle(
                                        color: isSelected ? Colors.indigo : Colors.black87,
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      ),
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(_error!, style: const TextStyle(color: Colors.red)),
                  ),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: Colors.grey[200]!)),
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submitAnswers,
                      child: Text(_submitting ? 'Submitting & Grading...' : 'Submit Answers'),
                    ),
                  ),
                )
              ],
            ),
    );
  }
}

class TestGradedScreen extends StatelessWidget {
  final String title;
  final Map<String, dynamic> result;

  const TestGradedScreen({
    super.key,
    required this.title,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final score = result['score'] ?? 0;
    final maxScore = result['max_score'] ?? 0;
    final correctCount = result['correct_count'] ?? 0;
    final wrongCount = result['wrong_count'] ?? 0;
    final questions = result['results'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Result Card'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            color: Colors.indigo.withOpacity(0.05),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: Colors.indigo,
                  child: Text(
                    '$score/$maxScore',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text(
                        'Correct: $correctCount | Incorrect: $wrongCount',
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: questions.length,
              itemBuilder: (context, index) {
                final q = questions[index];
                final options = q['options'] as List<dynamic>? ?? [];
                final chosenOpt = q['chosen_option'] as int?;
                final correctOpt = q['correct_option'] as int;
                final isCorrect = q['is_correct'] as bool? ?? false;
                final explanation = q['explanation']?.toString() ?? '';

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${index + 1}. ${q['question_text'] ?? ''}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        const SizedBox(height: 12),
                        ...List.generate(options.length, (optIdx) {
                          final optionText = options[optIdx].toString();
                          final isSelected = chosenOpt == optIdx;
                          final isCorrectOpt = correctOpt == optIdx;

                          Color borderCol = Colors.grey[300]!;
                          Color bgCol = Colors.transparent;
                          Color textCol = Colors.black87;

                          if (isCorrectOpt) {
                            borderCol = Colors.green;
                            bgCol = Colors.green.withOpacity(0.05);
                            textCol = Colors.green;
                          } else if (isSelected) {
                            borderCol = Colors.red;
                            bgCol = Colors.red.withOpacity(0.05);
                            textCol = Colors.red;
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: bgCol,
                              border: Border.all(color: borderCol, width: isSelected || isCorrectOpt ? 1.5 : 1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(optionText, style: TextStyle(color: textCol, fontSize: 13)),
                                if (isCorrectOpt)
                                  const Text('✓ Correct', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold))
                                else if (isSelected)
                                  const Text('✗ Chosen', style: TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '💡 Explanation:',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.indigo),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                explanation,
                                style: const TextStyle(fontSize: 12, height: 1.4),
                              ),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Back to Tests Center'),
            ),
          )
        ],
      ),
    );
  }
}
