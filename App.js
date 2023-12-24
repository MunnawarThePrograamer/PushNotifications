import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TextInput, Button, StyleSheet } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [pushToken, setPushToken] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');

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

  const sendNotification = () => {
    if (pushToken && notificationMessage.trim() !== '') {
      const notificationData = {
        to: pushToken,
        title: 'Custom Notification',
        body: notificationMessage,
      };

      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
          Host: 'exp.host',
        },
        body: JSON.stringify(notificationData),
      })
        .then((response) => response.json())
        .then((responseJson) => {
          console.log('Push notification sent successfully:', responseJson);
        })
        .catch((error) => {
          console.error('Error sending push notification:', error);
        });
    } else {
      Alert.alert('Push Token not available or message is empty');
    }
  };

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

    requestUserPermission();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Prograamer Tiffin Services</Text>
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