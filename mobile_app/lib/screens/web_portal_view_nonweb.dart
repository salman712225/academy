import 'package:flutter/material.dart';

class WebPortalView extends StatelessWidget {
  const WebPortalView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.computer_rounded, size: 80, color: Colors.indigo),
              const SizedBox(height: 16),
              const Text(
                'Administrative Web Portal',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Administrative features (like grading, batch open/close, book lending, and email tracking) are available on the Web Portal.\n\nPlease open the portal in your browser at:',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 16),
              SelectableText(
                'http://localhost:5173/',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
