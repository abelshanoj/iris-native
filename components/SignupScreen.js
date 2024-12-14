import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import Auth0 from 'react-native-auth0';

AUTHO_DOMAIN='dev-h3kr8d86kmzw5o8u.us.auth0.com'
AUTH0_CLIENT_ID='1xeC7oxiNMx92knH3MkKN3AYSxejciqp'
AUTH0_API_IDENTIFIER='https://dev-h3kr8d86kmzw5o8u.us.auth0.com/api/v2/'

// Replace these with your Auth0 domain and client ID
const auth0 = new Auth0({
  domain: AUTHO_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
});

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign up the user
      await auth0.auth.createUser({
        email,
        password,
        connection: 'Username-Password-Authentication', // Database connection name in Auth0
      });
      console.log('Signup successful');

      // Step 2: Log the user in
      const response = await auth0.auth.passwordRealm({
        username: email,
        password,
        realm: 'Username-Password-Authentication',
        audience: AUTH0_API_IDENTIFIER, // API identifier in Auth0
        scope: 'openid profile email',
      });

      const { accessToken } = response;
      console.log('Access Token:', accessToken);

      // Step 3: Navigate to the main page
      navigation.navigate('Main', { accessToken });
    } catch (error) {
      console.error('Error during signup or login:', error);
      Alert.alert('Error', 'Could not sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>
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
      <Button title={loading ? 'Signing up...' : 'Signup'} onPress={handleSignup} disabled={loading} />

      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Already have an account? Login
      </Text>
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
  link: {
    marginTop: 20,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});
