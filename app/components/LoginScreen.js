// components/LoginScreen.js
import React from 'react';
import { View, Text, TextInput, Button, Switch } from 'react-native';
import styles from '../styles';

const LoginScreen = ({
  onLogin,
  apiBase,
  onApiBaseChange,
  isSentryEnabled,
  onSentryToggle,
}) => {
  const [form, setForm] = React.useState({});

  const handleLogin = () => {
    onLogin(form);
  };

  return (
    <View>
      <Text
        style={{
          fontSize: 30,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        Login
      </Text>
      <Text style={{ marginVertical: 10 }}>
        If you don't have an account, one will be made for you when
        logging in.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        onChangeText={(text) => setForm({ ...form, username: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(text) => setForm({ ...form, password: text })}
      />
      <Text style={{ marginVertical: 10 }}>API Base URL:</Text>
      <TextInput
        style={styles.input}
        placeholder="API Base URL"
        defaultValue={apiBase}
        onChangeText={onApiBaseChange}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 10,
        }}
      >
        <Text style={{ fontSize: 15 }}>Enable Sentry:</Text>
        <Switch
          value={isSentryEnabled}
          onValueChange={onSentryToggle}
        />
      </View>
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
