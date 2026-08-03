import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:open_file/open_file.dart';

class ApiService {
  // Determine Base URL depending on Platform (Android emulator loopback vs standard localhost)
  static String get baseUrl {
    // Deployed Render cloud backend URL
    return 'https://academy-backend-rwez.onrender.com/api';
    
    // Local development fallback (uncomment to use local backend):
    // if (kIsWeb) {
    //   return 'http://localhost:8000/api';
    // } else if (Platform.isAndroid) {
    //   return 'http://10.0.2.2:8000/api';
    // } else {
    //   return 'http://localhost:8000/api';
    // }
  }

  // Save authentication token to persistent storage
  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('academy_token', token);
  }

  // Retrieve authentication token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('academy_token');
  }

  // Delete authentication token (logout)
  Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('academy_token');
  }

  // Perform POST login
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['access_token'];
        if (token != null) {
          await saveToken(token);
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Login Error: $e');
      return null;
    }
  }

  // Get current user profile information
  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Get Profile Error: $e');
      return null;
    }
  }

  // Get notes/study materials list
  Future<List<dynamic>> getNotes() async {
    try {
      final token = await getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/documents/notes'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('Get Notes Error: $e');
      return [];
    }
  }

  // Get current user's resume
  Future<Map<String, dynamic>?> getMyResume() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/documents/resumes/my-resume'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Get Resume Error: $e');
      return null;
    }
  }

  // Upload student resume
  Future<bool> uploadResume(String filePath) async {
    try {
      final token = await getToken();
      if (token == null) return false;

      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/documents/resumes/upload'),
      );
      
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('file', filePath));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return response.statusCode == 200;
    } catch (e) {
      print('Upload Resume Error: $e');
      return false;
    }
  }

  // Download a note and open it locally
  Future<bool> downloadAndOpenFile(String urlPath, String filename) async {
    try {
      final token = await getToken();
      if (token == null) return false;

      final response = await http.get(
        Uri.parse(urlPath),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        // Get device temporary directory
        final directory = await getTemporaryDirectory();
        final filePath = '${directory.path}/$filename';
        
        // Write file bytes to disk
        final file = File(filePath);
        await file.writeAsBytes(response.bodyBytes);

        // Open file using native app handler
        final openResult = await OpenFile.open(filePath);
        return openResult.type == ResultType.done;
      } else {
        print('Download Failed: status code ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('Download File Error: $e');
      return false;
    }
  }

  // Get logged-in student's attendance records
  Future<Map<String, dynamic>?> getMyAttendance() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/attendance/my-attendance'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Get Attendance Error: $e');
      return null;
    }
  }

  // Get logged-in student's library fines and lending history
  Future<Map<String, dynamic>?> getMyFines() async {
    try {
      final token = await getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/library/my-fines'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Get Fines Error: $e');
      return null;
    }
  }

  // Get placement/job leads
  Future<List<dynamic>> getLeads() async {
    try {
      final token = await getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/leads/'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('Get Leads Error: $e');
      return [];
    }
  }

  // Get academy events
  Future<List<dynamic>> getEvents() async {
    try {
      final token = await getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/events/'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('Get Events Error: $e');
      return [];
    }
  }

  // Get all batches
  Future<List<dynamic>> getBatches() async {
    try {
      final token = await getToken();
      if (token == null) return [];
      final response = await http.get(
        Uri.parse('$baseUrl/batches/'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('Get Batches Error: $e');
      return [];
    }
  }

  // Get batch students
  Future<List<dynamic>> getBatchStudents(String batchId) async {
    try {
      final token = await getToken();
      if (token == null) return [];
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/batch/$batchId/students'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('Get Batch Students Error: $e');
      return [];
    }
  }

  // Get batch attendance
  Future<List<dynamic>> getBatchAttendance(String batchId, {String? date}) async {
    try {
      final token = await getToken();
      if (token == null) return [];
      String url = '$baseUrl/attendance/batch/$batchId';
      if (date != null && date.isNotEmpty) {
        url += '?date=$date';
      }
      final response = await http.get(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('Get Batch Attendance Error: $e');
      return [];
    }
  }

  // Save manual attendance
  Future<Map<String, dynamic>?> saveManualAttendance(
      String batchId, String date, List<Map<String, dynamic>> records) async {
    try {
      final token = await getToken();
      if (token == null) return null;
      final response = await http.post(
        Uri.parse('$baseUrl/attendance/manual-update'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'batch_id': batchId,
          'date': date,
          'records': records,
        }),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorMsg = jsonDecode(response.body)['detail'] ?? 'Failed to save attendance';
        return {'error': errorMsg};
      }
    } catch (e) {
      print('Save Manual Attendance Error: $e');
      return {'error': e.toString()};
    }
  }

  // Get batch stats
  Future<Map<String, dynamic>?> getBatchStats(String batchId) async {
    try {
      final token = await getToken();
      if (token == null) return null;
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/batch/$batchId/stats'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Get Batch Stats Error: $e');
      return null;
    }
  }

  // Upload attendance spreadsheet
  Future<Map<String, dynamic>?> uploadAttendanceFile(String batchId, String filePath) async {
    try {
      final token = await getToken();
      if (token == null) return null;
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/attendance/upload'),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['batch_id'] = batchId;
      request.files.add(await http.MultipartFile.fromPath('file', filePath));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorMsg = jsonDecode(response.body)['detail'] ?? 'Failed to upload attendance file';
        return {'error': errorMsg};
      }
    } catch (e) {
      print('Upload Attendance File Error: $e');
      return {'error': e.toString()};
    }
  }

  // Get attendance schema
  Future<List<dynamic>> getAttendanceSchema() async {
    try {
      final token = await getToken();
      if (token == null) return [];
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/schema'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['expected_columns'] ?? [];
      }
      return [];
    } catch (e) {
      print('Get Attendance Schema Error: $e');
      return [];
    }
  }

  // Delete attendance for batch on specific date
  Future<Map<String, dynamic>?> deleteDateAttendance(String batchId, String dateStr) async {
    try {
      final token = await getToken();
      if (token == null) return null;
      final response = await http.delete(
        Uri.parse('$baseUrl/attendance/batch/$batchId/date/$dateStr'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorMsg = jsonDecode(response.body)['detail'] ?? 'Failed to delete attendance';
        return {'error': errorMsg};
      }
    } catch (e) {
      print('Delete Date Attendance Error: $e');
      return {'error': e.toString()};
    }
  }

  // Delete all attendance for batch
  Future<Map<String, dynamic>?> deleteAllBatchAttendance(String batchId) async {
    try {
      final token = await getToken();
      if (token == null) return null;
      final response = await http.delete(
        Uri.parse('$baseUrl/attendance/batch/$batchId/all'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorMsg = jsonDecode(response.body)['detail'] ?? 'Failed to delete all attendance';
        return {'error': errorMsg};
      }
    } catch (e) {
      print('Delete All Batch Attendance Error: $e');
      return {'error': e.toString()};
    }
  }

  // Upload note/material
  Future<bool> uploadNote(String title, String description, String filePath) async {
    try {
      final token = await getToken();
      if (token == null) return false;
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/documents/notes/upload'),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['title'] = title;
      request.fields['description'] = description;
      request.files.add(await http.MultipartFile.fromPath('file', filePath));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      return response.statusCode == 201;
    } catch (e) {
      print('Upload Note Error: $e');
      return false;
    }
  }

  // Delete note/material
  Future<bool> deleteNote(String noteId) async {
    try {
      final token = await getToken();
      if (token == null) return false;
      final response = await http.delete(
        Uri.parse('$baseUrl/documents/notes/$noteId'),
        headers: {'Authorization': 'Bearer $token'},
      );
      return response.statusCode == 204;
    } catch (e) {
      print('Delete Note Error: $e');
      return false;
    }
  }

  // List library books
  Future<List<dynamic>> listBooks() async {
    try {
      final token = await getToken();
      if (token == null) return [];
      final response = await http.get(
        Uri.parse('$baseUrl/library/books'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('List Books Error: $e');
      return [];
    }
  }

  // Create library book
  Future<bool> createBook(Map<String, dynamic> bookData) async {
    try {
      final token = await getToken();
      if (token == null) return false;
      final response = await http.post(
        Uri.parse('$baseUrl/library/books'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(bookData),
      );
      return response.statusCode == 201;
    } catch (e) {
      print('Create Book Error: $e');
      return false;
    }
  }

  // Update library book
  Future<bool> updateBook(String bookId, Map<String, dynamic> bookData) async {
    try {
      final token = await getToken();
      if (token == null) return false;
      final response = await http.put(
        Uri.parse('$baseUrl/library/books/$bookId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(bookData),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Update Book Error: $e');
      return false;
    }
  }

  // Delete library book
  Future<bool> deleteBook(String bookId) async {
    try {
      final token = await getToken();
      if (token == null) return false;
      final response = await http.delete(
        Uri.parse('$baseUrl/library/books/$bookId'),
        headers: {'Authorization': 'Bearer $token'},
      );
      return response.statusCode == 204;
    } catch (e) {
      print('Delete Book Error: $e');
      return false;
    }
  }

  // Lend a book copy
  Future<bool> lendBook(String bookId, String copyId, String studentEmail) async {
    try {
      final token = await getToken();
      if (token == null) return false;
      final response = await http.post(
        Uri.parse('$baseUrl/library/lend'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'book_id': bookId,
          'copy_id': copyId,
          'student_email': studentEmail,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Lend Book Error: $e');
      return false;
    }
  }

  // Return a lent book copy
  Future<bool> returnBook(String lendingId) async {
    try {
      final token = await getToken();
      if (token == null) return false;
      final response = await http.post(
        Uri.parse('$baseUrl/library/return/$lendingId'),
        headers: {'Authorization': 'Bearer $token'},
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Return Book Error: $e');
      return false;
    }
  }

  // List active lendings
  Future<List<dynamic>> getActiveLendings() async {
    try {
      final token = await getToken();
      if (token == null) return [];
      final response = await http.get(
        Uri.parse('$baseUrl/library/active-lendings'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      print('Get Active Lendings Error: $e');
      return [];
    }
  }
}
