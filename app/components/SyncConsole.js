// components/SyncConsole.js
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import styles from '../styles';

const SyncConsole = ({ log, lastUpdate, pointsUploaded }) => {
  return (
    <View style={styles.consoleContainer}>
      <Text style={styles.consoleTitle}>Sync Console</Text>
      <ScrollView style={styles.console} nestedScrollEnabled={true}>
        {log.length === 0 ? (
          <Text style={styles.consolePlaceholder}>
            Press "Sync Now" to see live updates.
          </Text>
        ) : (
          log.map((msg, index) => (
            <Text key={index} style={styles.consoleText}>
              {msg}
            </Text>
          ))
        )}
      </ScrollView>
      <View style={styles.consoleFooter}>
        <Text>Last update: {lastUpdate}</Text>
        <Text>Points uploaded: {pointsUploaded}</Text>
      </View>
    </View>
  );
};

export default SyncConsole;
