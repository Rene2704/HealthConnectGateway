// components/DashboardScreen.js
import React from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import styles from '../styles';
import Settings from './Settings';
import ManualSync from './ManualSync';
import SyncConsole from './SyncConsole';

const DashboardScreen = ({
  lastSync,
  apiBase,
  onApiBaseChange,
  taskDelay,
  onTaskDelayChange,
  isSentryEnabled,
  onSentryToggle,
  fullSyncMode,
  onFullSyncModeChange,
  onManualSync,
  onLogout,
  consoleLog,
  lastUpdateTime,
  totalPointsUploaded,
}) => {
  const handleFullSyncModeChange = async (value) => {
    onFullSyncModeChange(value);
    await setPlain('fullSyncMode', value.toString());
    Toast.show({
      type: 'info',
      text1: 'Sync mode updated',
    });
  };

  return (
    <ScrollView
      style={{ width: '100%' }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <Text style={{ fontSize: 20, marginVertical: 10 }}>
        You are currently logged in.
      </Text>
      <Text style={{ fontSize: 17, marginVertical: 10 }}>
        Last Sync: {lastSync}
      </Text>

      <Settings
        apiBase={apiBase}
        onApiBaseChange={onApiBaseChange}
        taskDelay={taskDelay}
        onTaskDelayChange={onTaskDelayChange}
        isSentryEnabled={isSentryEnabled}
        onSentryToggle={onSentryToggle}
        fullSyncMode={fullSyncMode}
        onFullSyncModeChange={handleFullSyncModeChange}
      />

      <ManualSync onManualSync={onManualSync} />

      <SyncConsole
        log={consoleLog}
        lastUpdate={lastUpdateTime}
        pointsUploaded={totalPointsUploaded}
      />

      <View style={{ marginTop: 20, width: 350, marginBottom: 50 }}>
        <Button title="Logout" onPress={onLogout} color={'darkred'} />
      </View>
    </ScrollView>
  );
};

// You'd need to re-export the setPlain function or move it to a shared helper file
const setPlain = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log(e);
  }
};

export default DashboardScreen;
