// Import necessary modules from React, React Native, and Expo
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TextInput, Button, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import messaging from '@react-native-firebase/messaging';

// Main App component
export default function App() {
  // State variables
  const [RegistrationId, setRegistrationId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [pushToken, setPushToken] = useState(null);
  const [pushTokenBE,setPushTokenBE]=useState('')
  console.log(pushTokenBE)
  const sendNotification = async () => {
    try {
      // Make a POST request to your backend server
      const response = await fetch('http://192.168.100.26:3000/send-push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          somePushTokens: [pushTokenBE], // Send an array of push tokens
          notificationMessage,
        }),
      });
  
      const result = await response.json();
      console.log(result);
  
      // You may want to show a success message to the user
      Alert.alert('Notification Sent', 'Push notification sent successfully');
    } catch (error) {
      console.error(error);
      // Handle the error and show an alert to the user
      Alert.alert('Error', 'Failed to send push notification');
    }
  };

  const registerUser = async () => {
    try {
      // Make a POST request to your backend server
      const response = await fetch('http://192.168.100.26:3000/storeData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: RegistrationId,
          pushToken: expoPushToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error('Error registering user:', error.message);
    }
  };


  function getPushToken() {
  
  
    fetch(`http://192.168.100.26:3000/getPushToken/${receiverId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          const pushToken = data.pushToken;
          // Use the pushToken as needed
          console.log('Push Token:', pushToken);
          setPushTokenBE(pushToken)
          // Optionally, update your UI or perform other actions here
        } else {
          console.error('Error:', data.error);
          // Optionally, handle error messages or update your UI
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        // Optionally, handle fetch errors or update your UI
      });
  }


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
  
      {/* New input fields for sender and receiver IDs */}
      <TextInput
        style={styles.input}
        placeholder="Registration only once"
        onChangeText={(text) => setRegistrationId(text)}
        value={RegistrationId}
      />
      <Button title="Register" onPress={registerUser} />
      <TextInput
        style={styles.input}
        placeholder="Receiver ID"
        onChangeText={(text) => setReceiverId(text)}
        value={receiverId}
      />
      <Button title="Retrive PushTocken" onPress={getPushToken} />

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
