const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

exports.sendChatNotification = onDocumentCreated(
  "connections/{connectionId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();

    if (!messageData) {
      console.log("No message data found.");
      return;
    }

    const connectionId = event.params.connectionId;

    const senderId = messageData.senderId;
    const messageText = messageData.text || "You have a new message.";

    console.log("New message received:", {
      connectionId,
      senderId,
      messageText,
    });

    // Get the connection document.
    const connectionDoc = await db
      .collection("connections")
      .doc(connectionId)
      .get();

    if (!connectionDoc.exists) {
      console.log("Connection document not found.");
      return;
    }

    const connectionData = connectionDoc.data();

    const members = connectionData.members || [];

    // Find the other user in the connection.
    const recipientId = members.find((uid) => uid !== senderId);

    if (!recipientId) {
      console.log("Recipient could not be determined.");
      return;
    }

    // Get recipient's FCM token.
    const recipientDoc = await db
      .collection("users")
      .doc(recipientId)
      .get();

    if (!recipientDoc.exists) {
      console.log("Recipient user document not found.");
      return;
    }

    const recipientData = recipientDoc.data();
    const fcmToken = recipientData.fcmToken;

    if (!fcmToken) {
      console.log("Recipient does not have an FCM token.");
      return;
    }

    // Send the notification.
    await messaging.send({
      token: fcmToken,
      notification: {
        title: "New message on Roomee",
        body: messageText,
      },
      webpush: {
        notification: {
          title: "New message on Roomee",
          body: messageText,
          icon: "/icons/Icon-192.png",
        },
      },
    });

    console.log("Chat notification sent successfully.");
  }
);