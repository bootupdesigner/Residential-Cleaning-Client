import React, { useState, useEffect } from "react";
import { View, Text, Button, SafeAreaView, ScrollView, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../hooks/useAuth";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Header from "../components/Header";
import { API_BASE_URL } from "../config";

const CreateAvailability = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [existingAvailability, setExistingAvailability] = useState({});
  const [availableDates, setAvailableDates] = useState([]);

  const availableTimes = [
    "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM"
  ];

  useEffect(() => {
    fetchAllAvailability();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailabilityForDate();
    }
  }, [selectedDate]);

  const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync("authToken");
    if (!token) {
      Alert.alert("Error", "Authentication error. Please sign in again.");
      router.replace("/signin");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchAllAvailability = async () => {
    const headers = await getAuthHeaders();
    if (!headers) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/get-availability`, { headers });

      const availability = response.data.availability || {};
      const today = moment().format("YYYY-MM-DD");
      const filteredDates = Object.keys(availability)
        .filter(date => date >= today)
        .sort();

      setExistingAvailability(availability);
      setAvailableDates(filteredDates);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to fetch availability.");
      setExistingAvailability({});
    }
  };

  const fetchAvailabilityForDate = () => {
    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
    setSelectedTimes(existingAvailability[formattedDate] || []);
  };

  const toggleTimeSelection = (time) => {
    setSelectedTimes(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const handleDateChange = (event, date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  const submitAvailability = async () => {
    if (selectedTimes.length === 0) {
      Alert.alert("Error", "Please select at least one time.");
      return;
    }

    const headers = await getAuthHeaders();
    if (!headers) return;

    const payload = {
      date: moment(selectedDate).format("YYYY-MM-DD"),
      times: selectedTimes.map(t => t.trim()),
    };

    try {
      await axios.put(`${API_BASE_URL}/api/admin/update-availability`, payload, { headers });
      Alert.alert("Success", "Availability updated successfully!");
      fetchAllAvailability();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update availability.");
    }
  };

  const deleteAvailability = async () => {
    const headers = await getAuthHeaders();
    if (!headers) return;

    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/delete-availability`, {
        headers,
        data: { date: formattedDate },
      });
      Alert.alert("Success", "Availability deleted successfully!");
      fetchAllAvailability();
      setSelectedTimes([]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to delete availability.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={true} home={true} title="Manage Availability" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Existing Availability:</Text>
        <View style={styles.inlineRow}>
          {availableDates.length > 0 ? (
            availableDates.map((date) => (
              <Text key={date} style={styles.dateItem}>
                📅 {moment(date).format("ddd, MMM D")}
              </Text>
            ))
          ) : (
            <Text>No availability set.</Text>
          )}
        </View>

        <Button title="Select Date" onPress={() => setShowDatePicker(true)} />
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        <Text style={styles.selectedDate}>
          Selected Date: {selectedDate.toDateString()}
        </Text>

        <Text style={styles.label}>Select Times:</Text>
        {availableTimes.map((time) => (
          <Button
            key={time}
            title={`${selectedTimes.includes(time) ? "✅ " : ""}${time}`}
            onPress={() => toggleTimeSelection(time)}
          />
        ))}

        <Button title="Update Availability" onPress={submitAvailability} color="green" />

        <TouchableOpacity onPress={deleteAvailability} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete Availability for Selected Date</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    padding: 20
  },
  selectedDate: { fontSize: 18, marginVertical: 10, textAlign: "center" },
  label: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  inlineRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  dateItem: { marginRight: 10, fontSize: 16 },
  deleteButton: { backgroundColor: "red", padding: 10, borderRadius: 5, marginTop: 20 },
  deleteText: { color: "white", textAlign: "center", fontSize: 16 },
});

export default CreateAvailability;
