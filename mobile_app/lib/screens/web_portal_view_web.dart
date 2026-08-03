import 'dart:html' as html;
import 'dart:ui_web' as ui_web;
import 'package:flutter/material.dart';

class WebPortalView extends StatefulWidget {
  const WebPortalView({super.key});

  @override
  State<WebPortalView> createState() => _WebPortalViewState();
}

class _WebPortalViewState extends State<WebPortalView> {
  @override
  void initState() {
    super.initState();
    // Register the iframe view factory once
    ui_web.platformViewRegistry.registerViewFactory(
      'web-portal-iframe',
      (int viewId) {
        final iframe = html.IFrameElement()
          ..src = 'http://localhost:5173/'
          ..style.border = 'none'
          ..style.width = '100%'
          ..style.height = '100%';
        return iframe;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return const HtmlElementView(
      viewType: 'web-portal-iframe',
    );
  }
}
