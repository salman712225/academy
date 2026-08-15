import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class LibraryMgmtTab extends StatefulWidget {
  final Map<String, dynamic>? userProfile;
  final ApiService apiService;

  const LibraryMgmtTab({
    super.key,
    required this.userProfile,
    required this.apiService,
  });

  @override
  State<LibraryMgmtTab> createState() => _LibraryMgmtTabState();
}

class _LibraryMgmtTabState extends State<LibraryMgmtTab> with SingleTickerProviderStateMixin {
  late TabController _subTabController;

  // Catalog States
  List<dynamic> _books = [];
  bool _loadingBooks = false;
  final Set<String> _expandedBookIds = {};

  // Active Lendings States
  List<dynamic> _activeLendings = [];
  bool _loadingLendings = false;

  // Lending Form States
  String? _selectedBookId;
  String? _selectedCopyId;
  final _studentEmailController = TextEditingController();
  bool _submittingLend = false;
  List<dynamic> _availableCopies = [];

  bool get _isHead => widget.userProfile?['role']?.toString().toLowerCase() == 'head';

  @override
  void initState() {
    super.initState();
    _subTabController = TabController(length: 3, vsync: this);
    _subTabController.addListener(_handleTabChange);
    _refreshTabSpecificData();
  }

  @override
  void dispose() {
    _subTabController.dispose();
    _studentEmailController.dispose();
    super.dispose();
  }

  void _handleTabChange() {
    if (_subTabController.indexIsChanging) return;
    _refreshTabSpecificData();
  }

  void _refreshTabSpecificData() {
    if (_subTabController.index == 0) {
      _fetchBooks();
    } else if (_subTabController.index == 1) {
      _fetchLendings();
    } else if (_subTabController.index == 2) {
      _fetchBooks(); // To populate Lend Book dropdown
    }
  }

  // --- CATALOG APIS ---
  Future<void> _fetchBooks() async {
    setState(() => _loadingBooks = true);
    final list = await widget.apiService.listBooks();
    if (mounted) {
      setState(() {
        _books = list;
        _loadingBooks = false;
        
        // Re-evaluate available copies if form is open
        if (_selectedBookId != null) {
          _updateAvailableCopies();
        }
      });
    }
  }

  void _updateAvailableCopies() {
    if (_selectedBookId == null) {
      setState(() => _availableCopies = []);
      return;
    }
    final book = _books.firstWhere((b) => b['id'] == _selectedBookId, orElse: () => null);
    if (book != null) {
      final copies = book['copies'] as List<dynamic>? ?? [];
      setState(() {
        _availableCopies = copies.where((c) => c['status'] == 'available').toList();
        if (_availableCopies.isNotEmpty) {
          _selectedCopyId = _availableCopies.first['copy_id']?.toString();
        } else {
          _selectedCopyId = null;
        }
      });
    } else {
      setState(() {
        _availableCopies = [];
        _selectedCopyId = null;
      });
    }
  }

  Future<void> _addOrEditBook({Map<String, dynamic>? existingBook}) async {
    final titleController = TextEditingController(text: existingBook?['title'] ?? '');
    final authorController = TextEditingController(text: existingBook?['author'] ?? '');
    final isbnController = TextEditingController(text: existingBook?['isbn'] ?? '');
    final qtyController = TextEditingController(text: existingBook?['quantity']?.toString() ?? '1');
    final isEdit = existingBook != null;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isEdit ? 'Edit Book Details' : 'Add Book to Catalog'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Title'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: authorController,
                decoration: const InputDecoration(labelText: 'Author'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: isbnController,
                decoration: const InputDecoration(labelText: 'ISBN'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: qtyController,
                decoration: const InputDecoration(
                  labelText: 'Quantity (Copies)',
                  hintText: 'e.g. 5',
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (titleController.text.trim().isEmpty ||
                  authorController.text.trim().isEmpty ||
                  isbnController.text.trim().isEmpty ||
                  int.tryParse(qtyController.text) == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please fill all fields with valid entries.')),
                );
                return;
              }
              Navigator.pop(context, true);
            },
            child: Text(isEdit ? 'Save Changes' : 'Add Book'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final payload = {
        'title': titleController.text.trim(),
        'author': authorController.text.trim(),
        'isbn': isbnController.text.trim(),
        'quantity': int.parse(qtyController.text),
      };

      bool success;
      if (isEdit) {
        success = await widget.apiService.updateBook(existingBook['id'], payload);
      } else {
        success = await widget.apiService.createBook(payload);
      }

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(isEdit ? 'Book updated successfully!' : 'Book added successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          _fetchBooks();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Operation failed. Please verify book details/ISBN conflicts.'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    }
  }

  Future<void> _deleteBook(dynamic book) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Book'),
        content: Text('Are you sure you want to remove "${book['title']}" from the catalog entirely? This will fail if copies are checked out.'),
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
      final success = await widget.apiService.deleteBook(book['id']);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Book deleted successfully.'), backgroundColor: Colors.green),
          );
          _fetchBooks();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to delete book. Make sure no copies are currently lent out.'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    }
  }

  // --- LENDING HISTORY & RETURN APIS ---
  Future<void> _fetchLendings() async {
    setState(() => _loadingLendings = true);
    final list = await widget.apiService.getActiveLendings();
    if (mounted) {
      setState(() {
        _activeLendings = list;
        _loadingLendings = false;
      });
    }
  }

  Future<void> _returnBook(dynamic lending) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Return'),
        content: Text('Record return for Copy: ${lending['copy_id']} lent to ${lending['student_email']}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm Return'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await widget.apiService.returnBook(lending['id']);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Book returned successfully!'), backgroundColor: Colors.green),
          );
          _fetchLendings();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to record return.'), backgroundColor: Colors.redAccent),
          );
        }
      }
    }
  }

  // --- LEND TRANSACTION APIS ---
  Future<void> _submitLending() async {
    if (_selectedBookId == null || _selectedCopyId == null) return;
    final email = _studentEmailController.text.trim().toLowerCase();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter borrower student\'s email.')),
      );
      return;
    }

    setState(() => _submittingLend = true);
    final success = await widget.apiService.lendBook(_selectedBookId!, _selectedCopyId!, email);

    if (mounted) {
      setState(() => _submittingLend = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Book copy lent successfully!'), backgroundColor: Colors.green),
        );
        // Clear form
        _studentEmailController.clear();
        _selectedBookId = null;
        _selectedCopyId = null;
        _availableCopies = [];
        
        // Refresh catalog, switch to active loans tab
        _fetchLendings();
        _subTabController.animateTo(1);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to lend book. Confirm student exists and copy is available.'),
            backgroundColor: Colors.redAccent,
          ),
        );
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
                  icon: Icon(Icons.library_books_rounded),
                  text: 'Book Catalog',
                ),
                Tab(
                  icon: Icon(Icons.assignment_ind_rounded),
                  text: 'Active Loans',
                ),
                Tab(
                  icon: Icon(Icons.outbox_rounded),
                  text: 'Lend Book',
                ),
              ],
            ),
          ),

          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _subTabController,
              children: [
                _buildCatalogView(context),
                _buildLoansView(context),
                _buildLendFormView(context),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _subTabController.index == 0 && _isHead
          ? FloatingActionButton(
              backgroundColor: theme.primaryColor,
              foregroundColor: Colors.white,
              onPressed: () => _addOrEditBook(),
              tooltip: 'Add Book',
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  // --- SUB-VIEW 1: CATALOG VIEW ---
  Widget _buildCatalogView(BuildContext context) {
    if (_loadingBooks && _books.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _fetchBooks,
      child: _books.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 100),
                Center(
                  child: Text('No books cataloged in the library yet.', style: TextStyle(color: Colors.grey)),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.only(left: 12, right: 12, top: 12, bottom: 80),
              itemCount: _books.length,
              itemBuilder: (context, index) {
                final book = _books[index];
                final bookId = book['id'];
                final title = book['title'] ?? 'Title';
                final author = book['author'] ?? 'Author';
                final isbn = book['isbn'] ?? 'ISBN';
                final qty = book['quantity'] ?? 0;
                final copies = book['copies'] as List<dynamic>? ?? [];
                
                final isExpanded = _expandedBookIds.contains(bookId);
                final availableCount = copies.where((c) => c['status'] == 'available').length;

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  child: Theme(
                    data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      key: PageStorageKey(bookId),
                      initiallyExpanded: isExpanded,
                      onExpansionChanged: (expanded) {
                        setState(() {
                          if (expanded) {
                            _expandedBookIds.add(bookId);
                          } else {
                            _expandedBookIds.remove(bookId);
                          }
                        });
                      },
                      leading: CircleAvatar(
                        backgroundColor: Colors.indigo[50],
                        child: const Icon(Icons.book_rounded, color: Colors.indigo),
                      ),
                      title: Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      subtitle: Text('By $author  |  ISBN: $isbn'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: availableCount > 0 ? Colors.green[50] : Colors.red[50],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '$availableCount/$qty Avail',
                              style: TextStyle(
                                color: availableCount > 0 ? Colors.green[800] : Colors.red[800],
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Icon(isExpanded ? Icons.expand_less : Icons.expand_more, color: Colors.grey),
                        ],
                      ),
                      children: [
                        const Divider(height: 1),
                        
                        // Edit & Delete row for Admin only
                        if (_isHead)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () => _addOrEditBook(existingBook: book),
                                  icon: const Icon(Icons.edit_rounded, size: 16),
                                  label: const Text('Edit Book'),
                                  style: TextButton.styleFrom(foregroundColor: Colors.indigo),
                                ),
                                const SizedBox(width: 8),
                                TextButton.icon(
                                  onPressed: () => _deleteBook(book),
                                  icon: const Icon(Icons.delete_outline, size: 16),
                                  label: const Text('Delete'),
                                  style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
                                ),
                              ],
                            ),
                          ),

                        // Copies list
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: copies.length,
                          itemBuilder: (context, cIdx) {
                            final copy = copies[cIdx];
                            final copyId = copy['copy_id'] ?? 'N/A';
                            final status = copy['status'] ?? 'available';
                            final lentTo = copy['lent_to']?.toString();

                            Color statusBg = Colors.green[50]!;
                            Color statusText = Colors.green[800]!;
                            if (status == 'lent') {
                              statusBg = Colors.orange[50]!;
                              statusText = Colors.orange[800]!;
                            }

                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
                              decoration: BoxDecoration(
                                border: Border(top: BorderSide(color: Colors.grey[100]!)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Copy ID: $copyId',
                                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                      ),
                                      if (status == 'lent' && lentTo != null) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          'Lent to: $lentTo',
                                          style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                        ),
                                      ],
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusBg,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      status.toString().toUpperCase(),
                                      style: TextStyle(color: statusText, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                            );
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

  // --- SUB-VIEW 2: LOANS VIEW ---
  Widget _buildLoansView(BuildContext context) {
    if (_loadingLendings && _activeLendings.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _fetchLendings,
      child: _activeLendings.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 100),
                Center(
                  child: Text('No active book loans currently.', style: TextStyle(color: Colors.grey)),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _activeLendings.length,
              itemBuilder: (context, index) {
                final lending = _activeLendings[index];
                final title = lending['book_title'] ?? 'Book Title';
                final copyId = lending['copy_id'] ?? 'Copy';
                final borrower = lending['student_email'] ?? 'borrower';
                final status = lending['status'] ?? 'lent';
                final fine = (lending['fine_amount'] as num?)?.toDouble() ?? 0.0;

                final lendDate = lending['lend_date'] != null ? lending['lend_date'].split('T')[0] : 'N/A';
                final dueDate = lending['due_date'] != null ? lending['due_date'].split('T')[0] : 'N/A';

                final isOverdue = status.toString().toLowerCase() == 'overdue';

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
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Copy: $copyId  |  Borrower: $borrower',
                                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isOverdue ? Colors.red[50] : Colors.blue[50],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isOverdue ? 'OVERDUE' : 'LENT',
                                style: TextStyle(
                                  color: isOverdue ? Colors.red[800] : Colors.blue[800],
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Lent Date', style: TextStyle(color: Colors.grey[500], fontSize: 11)),
                                const SizedBox(height: 2),
                                Text(lendDate, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Due Date', style: TextStyle(color: Colors.grey[500], fontSize: 11)),
                                const SizedBox(height: 2),
                                Text(
                                  dueDate,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    color: isOverdue ? Colors.red[800] : Colors.black,
                                  ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('Overdue Fine', style: TextStyle(color: Colors.grey[500], fontSize: 11)),
                                const SizedBox(height: 2),
                                Text(
                                  '₹${fine.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: fine > 0 ? Colors.red : Colors.grey[800],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 38),
                            side: const BorderSide(color: Colors.indigo),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => _returnBook(lending),
                          icon: const Icon(Icons.keyboard_return_rounded, size: 18),
                          label: const Text('Record Return', style: TextStyle(fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  // --- SUB-VIEW 3: LEND BOOK FORM VIEW ---
  Widget _buildLendFormView(BuildContext context) {
    if (_books.isEmpty && !_loadingBooks) {
      return const Center(child: Text('No catalog books found. Add books to the catalog first.'));
    }

    final catalogBooks = _books;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(
                children: [
                  Icon(Icons.outbox_rounded, color: Colors.indigo),
                  SizedBox(width: 8),
                  Text('Lend Book Copy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Lend a specific book copy to an active student by inputting their registered email.',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const Divider(height: 24),

              // Book Dropdown
              DropdownButtonFormField<String>(
                value: _selectedBookId,
                decoration: const InputDecoration(
                  labelText: 'Select Book',
                  border: OutlineInputBorder(),
                ),
                items: catalogBooks.map((b) {
                  return DropdownMenuItem<String>(
                    value: b['id']?.toString(),
                    child: Text(b['title']?.toString() ?? 'Untitled Book'),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() {
                    _selectedBookId = val;
                    _updateAvailableCopies();
                  });
                },
              ),
              const SizedBox(height: 16),

              // Copy Dropdown
              if (_selectedBookId != null) ...[
                if (_availableCopies.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: Text(
                      'No copies of this book are currently available in the catalog.',
                      style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w500),
                    ),
                  )
                else
                  DropdownButtonFormField<String>(
                    value: _selectedCopyId,
                    decoration: const InputDecoration(
                      labelText: 'Select Copy ID',
                      border: OutlineInputBorder(),
                    ),
                    items: _availableCopies.map((c) {
                      return DropdownMenuItem<String>(
                        value: c['copy_id']?.toString(),
                        child: Text(c['copy_id']?.toString() ?? 'Unnamed Copy'),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedCopyId = val;
                      });
                    },
                  ),
                const SizedBox(height: 16),
              ],

              // Borrower Student Email
              TextField(
                controller: _studentEmailController,
                decoration: const InputDecoration(
                  labelText: 'Borrower Student Email',
                  hintText: 'e.g. student@academy.com',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 24),

              // Submit Button
              _submittingLend
                  ? const Center(child: CircularProgressIndicator())
                  : ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: (_selectedBookId == null || _selectedCopyId == null)
                          ? null
                          : _submitLending,
                      child: const Text('Lend Book Copy', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
