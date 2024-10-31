import React, { useState, useRef } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [audioUri, setAudioUri] = useState('');
  const playbackInstance = useRef(new Audio.Sound());

  // Toggle recording start and stop
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }
      console.log('Starting recording..');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop recording and handle audio file
  const stopRecording = async () => {
    console.log('Stopping recording..');
    setIsRecording(false);
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    setAudioUri(uri);
    console.log('Recording stopped and stored at', uri);

    // Convert audio to base64 and send to backend
    const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    await sendAudio(base64Audio);

    setRecording(null);
  };

  // Send audio to backend for processing
  const sendAudio = async (base64Audio) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      const data = await response.json();
      console.log('Success:', data);

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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.micButton, isRecording ? styles.recording : null]}
        onPress={toggleRecording}
      >
        <Text style={styles.micText}>{isRecording ? 'Stop' : 'Record'}</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Response Text</Text>
      <ScrollView style={styles.responseBox}>
        <Text>{responseText}</Text>
      </ScrollView>
      
      {audioUri ? (
        <TouchableOpacity onPress={() => playbackInstance.current.replayAsync()}>
          <Text style={styles.playbackText}>Play Last Recorded Audio</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  micButton: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 50,
    marginBottom: 20,
  },
  recording: {
    backgroundColor: '#d9534f',
  },
  micText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  responseBox: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  playbackText: {
    color: '#007bff',
    fontSize: 16,
    marginTop: 10,
  },
});
