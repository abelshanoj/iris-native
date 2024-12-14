import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Auth0 from 'react-native-auth0';

AUTHO_DOMAIN='dev-h3kr8d86kmzw5o8u.us.auth0.com'
AUTH0_CLIENT_ID='1xeC7oxiNMx92knH3MkKN3AYSxejciqp'
AUTH0_API_IDENTIFIER='https://dev-h3kr8d86kmzw5o8u.us.auth0.com/api/v2/'

// Replace these with your Auth0 domain and client ID
const auth0 = new Auth0({
  domain: AUTHO_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await auth0.auth.passwordRealm({
        username: email,
        password: password,
        realm: 'Username-Password-Authentication', // Default realm for database connections in Auth0
        audience: AUTH0_API_IDENTIFIER, // Set up an API in Auth0 and use its identifier
        scope: 'openid profile email',
      });

      const { accessToken } = response;
      console.log('Access Token:', accessToken);

      // Pass the access token to your backend or navigate to the main screen
      navigation.navigate('Main', { accessToken });
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login Error', 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await auth0.webAuth.authorize({
        redirectUri: 'https://com.abel2003.sample_iris.auth0://dev-h3kr8d86kmzw5o8u.us.auth0.com/android/com.abel2003.sample_iris/callback',
        scope: 'openid profile email',
        audience: AUTH0_API_IDENTIFIER,
      });

      console.log('Access Token from Google Login:', result.accessToken);

      // Pass the access token to your backend or navigate to the main screen
      navigation.navigate('Main', { accessToken: result.accessToken });
    } catch (error) {
      console.error('Google Login failed:', error);
      Alert.alert('Google Login Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />

      <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleButton}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  googleButton: {
    marginTop: 10,
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 8,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    color: '#007bff',
  },
});
