importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCIvhLH-0Adoeqp-2KVbEgAoemfQSTri4",
  authDomain: "roomee-59456.firebaseapp.com",
  projectId: "roomee-59456",
  storageBucket: "roomee-59456.firebasestorage.app",
  messagingSenderId: "721732818960",
  appId: "1:721732818960:web:8b3afa06c7bf7673cc9295"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message',
    payload
  );

  const notificationTitle =
    payload.notification?.title || 'Roomee';

  const notificationOptions = {
    body:
      payload.notification?.body ||
      'You have a new notification from Roomee.',
    icon: '/icons/Icon-192.png'
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});