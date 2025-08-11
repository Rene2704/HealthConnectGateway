import React, { useState, useEffect, useReducer } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import messaging from '@react-native-firebase/messaging';
import { Notifications } from 'react-native-notifications';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import { requestNotifications } from 'react-native-permissions';

import styles from './styles';
import { get, setPlain, delkey } from './utils/storage';
import { loginFunc, refreshTokenFunc } from './services/auth';
import { sync, handlePush, handleDel } from './services/sync';

import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';

// Notification channel setup
Notifications.setNotificationChannel({
  channelId: 'push-errors',
  name: 'Push Errors',
  importance: 5,
  description: 'Alerts for push errors',
  enableLights: true,
  enableVibration: true,
});

const App = () => {
  const [login, setLogin] = useState(null);
  const [apiBase, setApiBase] = useState(
    'https://hc.reneandkiaramyhome.goip.de'
  );
  const [lastSync, setLastSync] = useState(null);
  const [taskDelay, setTaskDelay] = useState(7200 * 1000);
  const [fullSyncMode, setFullSyncMode] = useState(true);
  const [isSentryEnabled, setIsSentryEnabled] = useState(true);

  // Console State
  const [consoleLog, setConsoleLog] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [totalPointsUploaded, setTotalPointsUploaded] = useState(0);

  // This reducer is a simple way to force a re-render when needed
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    // Initial setup on app launch
    const initializeApp = async () => {
      // Sentry
      const sentry = await get('sentryEnabled');
      const isEnabled = sentry !== 'false';
      setIsSentryEnabled(isEnabled);
      if (isEnabled) {
        Sentry.init({
          dsn: 'https://e4a201b96ea602d28e90b5e4bbe67aa6@sentry.shuchir.dev/6',
        });
      }

      // Load saved settings
      get('apiBase').then((res) => res && setApiBase(res));
      get('lastSync').then((res) => res && setLastSync(res));
      get('fullSyncMode').then(
        (res) => res !== null && setFullSyncMode(res === 'true')
      );
      get('taskDelay').then(
        (res) => res && setTaskDelay(Number(res))
      );

      // Firebase messaging handlers
      messaging().setBackgroundMessageHandler(
        async (remoteMessage) => {
          if (remoteMessage.data.op === 'PUSH')
            handlePush(remoteMessage.data);
          if (remoteMessage.data.op === 'DEL')
            handleDel(remoteMessage.data, apiBase);
        }
      );
      messaging().onMessage((remoteMessage) => {
        if (remoteMessage.data.op === 'PUSH')
          handlePush(remoteMessage.data);
        if (remoteMessage.data.op === 'DEL')
          handleDel(remoteMessage.data, apiBase);
      });

      // Check login status and start background services
      const savedLogin = await get('login');
      if (savedLogin) {
        setLogin(savedLogin);
      }
    };

    initializeApp();
    requestNotifications(['alert']);
    ReactNativeForegroundService.register();
  }, []);

  useEffect(() => {
    // This effect runs when the user logs in or out
    if (login) {
      // Setup background tasks
      ReactNativeForegroundService.add_task(
        () => sync(apiBase, fullSyncMode),
        {
          delay: taskDelay,
          onLoop: true,
          taskId: 'hcgateway_sync',
        }
      );
      ReactNativeForegroundService.add_task(
        () =>
          refreshTokenFunc(apiBase).then(
            (newToken) => newToken && setLogin(newToken)
          ),
        {
          delay: 10800 * 1000, // 3 hours
          onLoop: true,
          taskId: 'refresh_token',
        }
      );
      ReactNativeForegroundService.start({
        id: 1244,
        title: 'HCGateway Sync Service',
        message: 'Background sync service is running.',
      });
    } else {
      // Stop background tasks if logged out
      if (ReactNativeForegroundService.is_running()) {
        ReactNativeForegroundService.stop();
      }
    }
  }, [login, apiBase, fullSyncMode, taskDelay]);

  const handleLogin = (form) => {
    loginFunc(form, apiBase, setLogin);
  };

  const handleLogout = () => {
    delkey('login');
    setLogin(null);
    Toast.show({ type: 'success', text1: 'Logged out successfully' });
  };

  const handleApiBaseChange = (text) => {
    setApiBase(text);
    setPlain('apiBase', text);
  };

  const handleTaskDelayChange = (text) => {
    const hours = Number(text);
    if (isNaN(hours) || hours <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid interval' });
      return;
    }
    const newDelay = hours * 60 * 60 * 1000;
    setTaskDelay(newDelay);
    setPlain('taskDelay', String(newDelay));
    Toast.show({
      type: 'success',
      text1: `Sync interval updated to ${hours} hours`,
    });
  };

  const handleSentryToggle = async (value) => {
    setIsSentryEnabled(value);
    if (value) {
      Sentry.init({
        dsn: 'https://e4a201b96ea602d28e90b5e4bbe67aa6@sentry.shuchir.dev/6',
      });
      Toast.show({ type: 'success', text1: 'Sentry enabled' });
    } else {
      Sentry.close();
      Toast.show({ type: 'success', text1: 'Sentry disabled' });
    }
    await setPlain('sentryEnabled', value.toString());
  };

  const handleManualSync = async (customStartDate, customEndDate) => {
    setConsoleLog(['Sync started...']);
    setTotalPointsUploaded(0);
    setLastUpdateTime('');

    const onProgress = (progress) => {
      const message = `[${progress.time.toLocaleTimeString()}] Uploaded ${
        progress.count
      } for ${progress.type}.`;
      setConsoleLog((prev) => [message, ...prev.slice(0, 99)]);
      setTotalPointsUploaded(
        (prevTotal) => prevTotal + progress.count
      );
      setLastUpdateTime(progress.time.toLocaleString());
    };

    await sync(
      apiBase,
      fullSyncMode,
      customStartDate,
      customEndDate,
      onProgress
    );
    const newLastSync = new Date().toISOString();
    setLastSync(newLastSync);
    await setPlain('lastSync', newLastSync);

    setConsoleLog((prev) => [`Sync finished.`, ...prev]);
  };

  return (
    <View style={styles.container}>
      {login ? (
        <DashboardScreen
          lastSync={lastSync}
          apiBase={apiBase}
          onApiBaseChange={handleApiBaseChange}
          taskDelay={taskDelay}
          onTaskDelayChange={handleTaskDelayChange}
          isSentryEnabled={isSentryEnabled}
          onSentryToggle={handleSentryToggle}
          fullSyncMode={fullSyncMode}
          onFullSyncModeChange={setFullSyncMode}
          onManualSync={handleManualSync}
          onLogout={handleLogout}
          consoleLog={consoleLog}
          lastUpdateTime={lastUpdateTime}
          totalPointsUploaded={totalPointsUploaded}
        />
      ) : (
        <LoginScreen
          onLogin={handleLogin}
          apiBase={apiBase}
          onApiBaseChange={handleApiBaseChange}
          isSentryEnabled={isSentryEnabled}
          onSentryToggle={handleSentryToggle}
        />
      )}
      <StatusBar style="dark" />
      <Toast />
    </View>
  );
};

export default App;
