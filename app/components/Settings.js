// components/Settings.js
import React from 'react';
import { View, Text, TextInput, Switch, Button } from 'react-native';
import styles from '../styles';

const Settings = ({
  apiBase,
  onApiBaseChange,
  taskDelay,
  onTaskDelayChange,
  isSentryEnabled,
  onSentryToggle,
  fullSyncMode,
  onFullSyncModeChange,
}) => {
  const [showSyncWarning, setShowSyncWarning] = React.useState(false);

  const handleFullSyncToggle = (value) => {
    if (!value) {
      setShowSyncWarning(true);
    } else {
      onFullSyncModeChange(true);
    }
  };

  const confirmIncrementalSync = () => {
    onFullSyncModeChange(false);
    setShowSyncWarning(false);
  };

  return (
    <>
      <Text style={{ marginTop: 10, fontSize: 15 }}>
        API Base URL:
      </Text>
      <TextInput
        style={styles.input}
        defaultValue={apiBase}
        onChangeText={onApiBaseChange}
      />

      <Text style={{ marginTop: 10, fontSize: 15 }}>
        Sync Interval (in hours):
      </Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        defaultValue={(taskDelay / (1000 * 60 * 60)).toString()}
        onChangeText={onTaskDelayChange}
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

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 10,
        }}
      >
        <Text style={{ fontSize: 15 }}>Full 30-day sync:</Text>
        <Switch
          value={fullSyncMode}
          onValueChange={handleFullSyncToggle}
        />
      </View>

      {showSyncWarning && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Warning: Incremental sync only syncs data since the last
            sync. You may miss data if the app stops abruptly.
          </Text>
          <View style={styles.warningButtons}>
            <Button
              title="Cancel"
              onPress={() => setShowSyncWarning(false)}
            />
            <Button
              title="Continue"
              onPress={confirmIncrementalSync}
            />
          </View>
        </View>
      )}
    </>
  );
};

export default Settings;
