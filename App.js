// Import necessary modules from React, React Native, and Expo
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TextInput, Button, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import messaging from '@react-native-firebase/messaging';

// Main App component
export default function App() {
  // State variables
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [pushToken, setPushToken] = useState(null);
  console.log("This is Recipent Push Token",pushToken)
  // Function to request user permission for push notifications
  async function requestUserPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        const token = await messaging().getToken();
        setPushToken(token);
        console.log('Push Token:', token);
      } else {
        console.log('Failed to get authorization status');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  }

  // Function to register for push notifications
  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: "199731ef-0709-409e-b62f-2a497b61886d" });
      const token = tokenData.data;
      setExpoPushToken(token);
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('Error getting Expo push token:', error);
    }
  };

  // Effect hook for handling push token listener and registration on component mount
  useEffect(() => {
    const subscription = Notifications.addPushTokenListener(({ data: token }) => {
      console.log('Expo push token received:', token);
      setExpoPushToken(token);
    });

    registerForPushNotificationsAsync();

    return () => {
      subscription.remove();
    };
  }, []);

  // Function to send a custom push notification
  const sendNotification = async () => {
    if (expoPushToken && notificationMessage.trim() !== '') {
      console.log("from Munnawar",expoPushToken)
      const notificationData = {
        to: expoPushToken,
        title: 'Custom Notification',
        body: notificationMessage,
      };

      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
            Host: 'exp.host',
          },
          body: JSON.stringify(notificationData),
        });

        const responseJson = await response.json();

        if (responseJson && responseJson.data && responseJson.data.details && responseJson.data.details.error) {
          // Handle specific error if available
          console.error('Push notification error:', responseJson.data.details.error);
        } else {
          console.log('Push notification sent successfully:', responseJson);
        }
      } catch (error) {
        console.error('Error sending push notification:', error.message);
      }
    } else {
      Alert.alert('Expo Push Token not available or message is empty');
    }
  };

  // Effect hook for handling Firebase Cloud Messaging (FCM) messages and notifications
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    messaging().getInitialNotification().then(async (remoteMessage) => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
        Alert.alert(
          'Notification caused app to open from quit state:',
          JSON.stringify(remoteMessage.notification),
        );
      }
    });

    messaging().onNotificationOpenedApp(async (remoteMessage) => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
      Alert.alert(
        'Notification caused app to open from background state:',
        JSON.stringify(remoteMessage.notification),
      );
    });

    // Register background handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Request user permission for push notifications
    requestUserPermission();

    return () => {
      unsubscribe();
    };
  }, []);

  // Render UI
  return (
    <View style={styles.container}>
      <Text>Programmer Tiffin Services</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter notification message"
        onChangeText={(text) => setNotificationMessage(text)}
        value={notificationMessage}
      />
      <Button title="Send Notification" onPress={sendNotification} />
      <StatusBar style="auto" />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 10,
    padding: 8,
    width: '80%',
  },
});
