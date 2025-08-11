// components/ManualSync.js
import React from 'react';
import { View, Text, Button, Modal } from 'react-native';
import DateTimePicker, {
  useDefaultStyles,
} from 'react-native-ui-datepicker';
import styles from '../styles';

const ManualSync = ({ onManualSync }) => {
  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date());
  const [useCustomDates, setUseCustomDates] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const defaultCalStyles = useDefaultStyles();

  const formatDateToISOString = (date) => {
    if (!date) return null;
    const midnightDate = new Date(date);
    midnightDate.setHours(0, 0, 0, 0);
    return midnightDate.toISOString();
  };

  const formatDateToReadable = (date) => {
    if (!date) return 'Not selected';
    return date.toLocaleDateString();
  };

  const handleSyncPress = () => {
    const finalStartDate = useCustomDates
      ? formatDateToISOString(startDate)
      : null;
    const finalEndDate = useCustomDates
      ? formatDateToISOString(endDate)
      : null;
    onManualSync(finalStartDate, finalEndDate);
  };

  return (
    <>
      <View style={{ marginTop: 10, marginBottom: 5, width: 350 }}>
        <Text style={{ fontSize: 15, marginBottom: 5 }}>
          Sync Range:
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text>
            {formatDateToReadable(startDate)} -{' '}
            {formatDateToReadable(endDate)}
          </Text>
          <Button
            title="Select Dates"
            onPress={() => setShowDatePicker(true)}
          />
        </View>
      </View>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <DateTimePicker
              mode="range"
              maxDate={new Date()}
              startDate={startDate}
              endDate={endDate}
              onChange={(params) => {
                setUseCustomDates(true);
                if (params.startDate) setStartDate(params.startDate);
                if (params.endDate) setEndDate(params.endDate);
              }}
              styles={defaultCalStyles}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowDatePicker(false)}
                color="darkgrey"
              />
              <Button
                title="Apply"
                onPress={() => {
                  setUseCustomDates(true);
                  setShowDatePicker(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ marginTop: 10, marginBottom: 10, width: 350 }}>
        <Button
          title={
            useCustomDates
              ? 'Sync Selected Range'
              : 'Sync Now (Default)'
          }
          onPress={handleSyncPress}
        />
      </View>
    </>
  );
};

export default ManualSync;
