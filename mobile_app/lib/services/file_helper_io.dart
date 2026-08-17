import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';

Future<bool> saveAndOpenFile(List<int> bytes, String filename) async {
  final directory = await getTemporaryDirectory();
  final filePath = '${directory.path}/$filename';
  final file = File(filePath);
  await file.writeAsBytes(bytes);
  final openResult = await OpenFile.open(filePath);
  return openResult.type == ResultType.done;
}
