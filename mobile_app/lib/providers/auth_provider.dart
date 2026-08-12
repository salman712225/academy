import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  bool _isAuthenticated = false;
  Map<String, dynamic>? _userProfile;
  bool _isLoading = false;

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get userProfile => _userProfile;
  bool get isLoading => _isLoading;

  // Auto-login checking saved token at startup
  Future<bool> tryAutoLogin() async {
    await Future.microtask(() {
      _isLoading = true;
      notifyListeners();
    });

    try {
      final token = await _apiService.getToken();
      if (token != null) {
        final profile = await _apiService.getProfile();
        if (profile != null) {
          _isAuthenticated = true;
          _userProfile = profile;
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
    } catch (e) {
      print('Auto-login failed: $e');
    }

    _isAuthenticated = false;
    _userProfile = null;
    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Attempt login
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    final loginData = await _apiService.login(email, password);
    if (loginData != null) {
      final profile = await _apiService.getProfile();
      if (profile != null) {
        _isAuthenticated = true;
        _userProfile = profile;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Logout current user session
  Future<void> logout() async {
    await _apiService.removeToken();
    _isAuthenticated = false;
    _userProfile = null;
    notifyListeners();
  }
}
