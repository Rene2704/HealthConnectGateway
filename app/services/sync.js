import axios from 'axios';
import Toast from 'react-native-toast-message';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import { Notifications } from 'react-native-notifications';
import {
  initialize,
  readRecords,
  readRecord,
  insertRecords,
  deleteRecordsByUuids,
} from 'react-native-health-connect';
import { get, setPlain } from '../utils/storage';

export const sync = async (
  apiBase,
  fullSyncMode,
  customStartTime,
  customEndTime,
  onProgressCallback
) => {
  await initialize();
  console.log('Syncing data...');
  let numRecords = 0;
  let numRecordsSynced = 0;
  Toast.show({
    type: 'info',
    text1: customStartTime
      ? 'Syncing from custom time...'
      : 'Syncing data...',
  });

  const login = await get('login');
  if (!login) {
    Toast.show({ type: 'error', text1: 'Not logged in' });
    return;
  }

  const currentTime = new Date().toISOString();
  let lastSync = await get('lastSync');

  let startTime;
  if (customStartTime) {
    startTime = customStartTime;
  } else if (fullSyncMode) {
    startTime = new Date(
      new Date().setDate(new Date().getDate() - 29)
    ).toISOString();
  } else {
    startTime =
      lastSync ||
      new Date(
        new Date().setDate(new Date().getDate() - 29)
      ).toISOString();
  }

  if (!customStartTime) {
    await setPlain('lastSync', currentTime);
  }

  const recordTypes = [
    'ActiveCaloriesBurned',
    'BasalBodyTemperature',
    'BloodGlucose',
    'BloodPressure',
    'BasalMetabolicRate',
    'BodyFat',
    'BodyTemperature',
    'BoneMass',
    'CyclingPedalingCadence',
    'CervicalMucus',
    'ExerciseSession',
    'Distance',
    'ElevationGained',
    'FloorsClimbed',
    'HeartRate',
    'Height',
    'Hydration',
    'LeanBodyMass',
    'MenstruationFlow',
    'MenstruationPeriod',
    'Nutrition',
    'OvulationTest',
    'OxygenSaturation',
    'Power',
    'RespiratoryRate',
    'RestingHeartRate',
    'SleepSession',
    'Speed',
    'Steps',
    'StepsCadence',
    'TotalCaloriesBurned',
    'Vo2Max',
    'Weight',
    'WheelchairPushes',
  ];

  const allPromises = [];

  for (const recordType of recordTypes) {
    try {
      console.log(
        `Reading records for ${recordType} from ${startTime} to ${new Date().toISOString()}`
      );
      const recordsResult = await readRecords(recordType, {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime,
          endTime: customEndTime || new Date().toISOString(),
        },
      });
      const records = recordsResult.records;
      numRecords += records.length;

      if (
        ['SleepSession', 'Speed', 'HeartRate'].includes(recordType)
      ) {
        const detailPromises = records.map((recordMeta, j) => {
          return new Promise((resolve) => {
            setTimeout(async () => {
              try {
                const record = await readRecord(
                  recordType,
                  recordMeta.metadata.id
                );
                await axios.post(
                  `${apiBase}/api/v2/sync/${recordType}`,
                  { data: record },
                  { headers: { Authorization: `Bearer ${login}` } }
                );
                if (onProgressCallback) {
                  onProgressCallback({
                    count: 1,
                    type: recordType,
                    time: new Date(),
                  });
                }
                numRecordsSynced++;
                ReactNativeForegroundService.update({
                  id: 1244,
                  title: 'HCGateway Sync Progress',
                  message: `Syncing... [${numRecordsSynced}/${numRecords}]`,
                  progress: {
                    max: numRecords,
                    curr: numRecordsSynced,
                  },
                });
              } catch (err) {
                console.log(err);
              }
              resolve();
            }, j * 1000); // Stagger requests
          });
        });
        allPromises.push(...detailPromises);
      } else {
        if (records.length === 0) continue;
        const promise = (async () => {
          try {
            await axios.post(
              `${apiBase}/api/v2/sync/${recordType}`,
              { data: records },
              { headers: { Authorization: `Bearer ${login}` } }
            );
            if (onProgressCallback) {
              onProgressCallback({
                count: records.length,
                type: recordType,
                time: new Date(),
              });
            }
            numRecordsSynced += records.length;
            ReactNativeForegroundService.update({
              id: 1244,
              title: 'HCGateway Sync Progress',
              message: `Syncing... [${numRecordsSynced}/${numRecords}]`,
              progress: { max: numRecords, curr: numRecordsSynced },
            });
          } catch (err) {
            console.log(err);
          }
        })();
        allPromises.push(promise);
      }
    } catch (err) {
      console.log(`Error reading ${recordType}:`, err);
    }
  }

  await Promise.all(allPromises);

  ReactNativeForegroundService.update({
    id: 1244,
    title: 'HCGateway Sync Service',
    message: 'Background sync service is running.',
  });
  console.log('Sync fully completed.');
};

export const handlePush = async (message) => {
  await initialize();
  const data = JSON.parse(message.data);
  console.log('Pushing data:', data);

  try {
    const ids = await insertRecords(data);
    console.log('Records inserted successfully: ', { ids });
  } catch (error) {
    Notifications.postLocalNotification({
      body: 'Error: ' + error.message,
      title: `Push failed for ${data[0].recordType}`,
      silent: false,
      category: 'Push Errors',
      android_channel_id: 'push-errors',
    });
  }
};

export const handleDel = async (message, apiBase) => {
  await initialize();
  const data = JSON.parse(message.data);
  const login = await get('login');
  console.log('Deleting data:', data);

  deleteRecordsByUuids(data.recordType, data.uuids, data.uuids);
  axios.delete(`${apiBase}/api/v2/sync/${data.recordType}`, {
    data: { uuid: data.uuids },
    headers: { Authorization: `Bearer ${login}` },
  });
};
