import axios from 'axios';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';
import { setPlain, get, delkey } from '../utils/storage';
import { askForPermissions } from '../utils/permissions';

const requestUserPermission = async () => {
  try {
    await messaging().requestPermission();
    const token = await messaging().getToken();
    console.log('Device Token:', token);
    return token;
  } catch (error) {
    console.log('Permission or Token retrieval error:', error);
  }
};

export const loginFunc = async (form, apiBase, setLogin) => {
  Toast.show({
    type: 'info',
    text1: 'Logging in...',
    autoHide: false,
  });

  try {
    let fcmToken = await requestUserPermission();
    const payload = { ...form, fcmToken };
    let response = await axios.post(
      `${apiBase}/api/v2/login`,
      payload
    );

    if ('token' in response.data) {
      await setPlain('login', response.data.token);
      await setPlain('refreshToken', response.data.refresh);
      setLogin(response.data.token);
      Toast.hide();
      Toast.show({
        type: 'success',
        text1: 'Logged in successfully',
      });
      askForPermissions();
    } else {
      Toast.hide();
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: response.data.error,
      });
    }
  } catch (err) {
    Toast.hide();
    Toast.show({
      type: 'error',
      text1: 'Login failed',
      text2: err.message,
    });
  }
};

export const refreshTokenFunc = async (apiBase) => {
  let refreshToken = await get('refreshToken');
  if (!refreshToken) return;

  try {
    let response = await axios.post(`${apiBase}/api/v2/refresh`, {
      refresh: refreshToken,
    });

    if ('token' in response.data) {
      await setPlain('login', response.data.token);
      await setPlain('refreshToken', response.data.refresh);
      Toast.show({
        type: 'success',
        text1: 'Token refreshed successfully',
      });
      return response.data.token;
    } else {
      Toast.show({
        type: 'error',
        text1: 'Token refresh failed',
        text2: response.data.error,
      });
      delkey('login');
      return null;
    }
  } catch (err) {
    Toast.show({
      type: 'error',
      text1: 'Token refresh failed',
      text2: err.message,
    });
    delkey('login');
    return null;
  }
};
