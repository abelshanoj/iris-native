// AppMain.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, InteractionManager } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';

export default function AppMain({ navigation, route }) {
  const { accessToken } = route.params;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [audioUri, setAudioUri] = useState('');
  const playbackInstance = useRef(new Audio.Sound());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (accessToken) {
      sendAccessTokenToBackend(accessToken);
    } else {
      Alert.alert('Error', 'Access token is missing!');
    }
  }, [accessToken]);

  // Function to send the access token to the backend
  const sendAccessTokenToBackend = async (token) => {
    try {
      const response = await fetch('https://your-backend.com/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Send token as a Bearer token
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to send token: ${response.status}`);
      }

      const data = await response.json();
      console.log('Token successfully sent:', data);
    } catch (error) {
      console.error('Error sending access token:', error);
      Alert.alert('Error', 'Failed to send token to backend.');
    }
  };

  // Toggle recording start and stop
  const toggleMic = async () => {
    setIsRecording((prev) => !prev);

    // Run haptics feedback without blocking UI updates
    InteractionManager.runAfterInteractions(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });

    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);

      // Haptics feedback when recording starts
      InteractionManager.runAfterInteractions(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });

      startPulseAnimation();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop recording and handle audio file
  const stopRecording = async () => {
    setIsRecording(false);
    stopPulseAnimation();

    // Haptics feedback when recording stops
    InteractionManager.runAfterInteractions(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    });
    
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    setAudioUri(uri);

    const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    await sendAudio(base64Audio);

    setRecording(null);
  };

  // Send audio to backend for processing
  const sendAudio = async (base64Audio) => {
    try {
      const response = await fetch('https://ruling-toad-nationally.ngrok-free.app/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      const data = await response.json();

      if (data.audio) {
        playAudioResponse(data.audio);
        setResponseText(data.message || '');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  // Play audio response from backend
  const playAudioResponse = async (base64Audio) => {
    const audioUri = FileSystem.cacheDirectory + 'responseAudio.webm';
    await FileSystem.writeAsStringAsync(audioUri, base64Audio, { encoding: FileSystem.EncodingType.Base64 });
    await playbackInstance.current.unloadAsync();
    await playbackInstance.current.loadAsync({ uri: audioUri });
    await playbackInstance.current.playAsync();
  };

  // Play last recorded audio
  const playLastRecordedAudio = async () => {
    try {
      if (audioUri) {
        await playbackInstance.current.unloadAsync();
        await playbackInstance.current.loadAsync({ uri: audioUri });
        await playbackInstance.current.playAsync();
      } else {
        alert('No audio recorded yet.');
      }
    } catch (error) {
      console.error('Error playing last recorded audio:', error);
    }
  };

  // Pulse animation for recording effect
  const startPulseAnimation = () => {
    requestAnimationFrame(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.micButtonContainer,
          isRecording && styles.isRecording,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <TouchableOpacity style={styles.micButton} onPress={toggleMic}>
          <MaterialIcons name="mic" size={80} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.heading}>Response Text</Text>
      <ScrollView style={styles.responseBox}>
        <Text style={styles.responseText}>{responseText}</Text>
      </ScrollView>

      {audioUri ? (
        <TouchableOpacity onPress={playLastRecordedAudio}>
          <Text style={styles.playbackText}>Play Last Recorded Audio</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#121212',
  },
  micButtonContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  isRecording: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 20,
  },
  responseBox: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#444',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#1e1e1e',
  },
  responseText: {
    color: '#fff',
  },
  playbackText: {
    color: '#007bff',
    fontSize: 16,
    marginTop: 10,
  },
});

