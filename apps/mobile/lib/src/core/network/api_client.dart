import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../config/app_config.dart';

class ApiClient {
  ApiClient()
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.current.apiBaseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 20),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = Supabase.instance.client.auth.currentSession?.accessToken;
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;

  Future<Map<String, dynamic>> getJson(String path) async {
    try {
      final response = await _dio.get<Object?>(path);
      return _asMap(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await _dio.post<Object?>(path, data: body);
      return _asMap(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<Map<String, dynamic>> putJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await _dio.put<Object?>(path, data: body);
      return _asMap(response.data);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Map<String, dynamic> _asMap(Object? data) {
    if (data is Map<String, dynamic>) {
      return data;
    }
    return <String, dynamic>{};
  }
}

class ApiException implements Exception {
  const ApiException(this.message);

  factory ApiException.fromDio(DioException error) {
    final data = error.response?.data;
    if (data is Map && data['message'] is String) {
      return ApiException(data['message'] as String);
    }
    if (data is Map && data['message'] is List) {
      return ApiException((data['message'] as List).join(', '));
    }
    return ApiException(error.message ?? 'Network request failed');
  }

  final String message;

  @override
  String toString() => message;
}

