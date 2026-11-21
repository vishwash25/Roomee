import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class NotificationService {
  static final FirebaseMessaging _messaging =
      FirebaseMessaging.instance;

  static bool _initialized = false;

  static const String vapidKey =
      'BLTVj7Vno4qD6Dkn3FitcHGv5d9rBnejhnEwV1TGqG14Fu2mqB5bNZK6g7hh6cNk95sKzqMQfFSNW9IvlVX3HyU';

  static Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    // Set this immediately so repeated calls from AuthGate.build()
    // cannot start multiple FCM initialization processes.
    _initialized = true;

    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      debugPrint('FCM: No user is currently logged in.');
      return;
    }

    // Ask the browser/user for notification permission.
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    debugPrint(
      'FCM permission status: ${settings.authorizationStatus}',
    );

    if (settings.authorizationStatus ==
        AuthorizationStatus.denied) {
      debugPrint('FCM: Notification permission denied.');
      return;
    }

    String? token;

    if (kIsWeb) {
      token = await _messaging.getToken(
        vapidKey: vapidKey,
      );
    } else {
      token = await _messaging.getToken();
    }

    if (token == null) {
      debugPrint('FCM: Could not get notification token.');
      return;
    }

    debugPrint('FCM Token received.');

    // Save the token for the currently logged-in user.
    await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .set(
      {
        'fcmToken': token,
        'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    debugPrint('FCM token saved to Firestore.');

    // Update Firestore whenever Firebase refreshes the token.
    _messaging.onTokenRefresh.listen((newToken) async {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .set(
        {
          'fcmToken': newToken,
          'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true),
      );

      debugPrint('FCM token refreshed and saved.');
    });

    // Messages received while the app is open.
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint(
        'FCM foreground message: ${message.notification?.title}',
      );

      debugPrint(
        'FCM body: ${message.notification?.body}',
      );
    });
  }
}