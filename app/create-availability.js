import React, { useState, useEffect } from "react";
import { View, Text, Button, SafeAreaView, ScrollView, StyleSheet, Alert, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Header from "../components/Header";

const API_BASE_URL = Platform.OS === "android" || "ios" ? "http://10.0.0.191:5000" : "http://localhost:5000";

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

  const fetchAllAvailability = async () => {
    try {
      console.log("🔹 Fetching availability...");
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/get-availability`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
  
      console.log("✅ Full API Response:", response.data); // ✅ Log API response
  
      if (!response.data || !response.data.availability) {
        console.error("❌ No availability data received.");
        setExistingAvailability({});
        return;
      }
  
      const availability = response.data.availability;
      const today = moment().format("YYYY-MM-DD");
      const filteredDates = Object.keys(availability)
        .filter(date => date >= today)
        .sort();
  
      setExistingAvailability(availability);
      setAvailableDates(filteredDates);
    } catch (error) {
      console.error("❌ Error fetching availability:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to fetch availability.");
      setExistingAvailability({});
    }
  };
  

  const fetchAvailabilityForDate = async () => {
    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
    setSelectedTimes(existingAvailability[formattedDate] || []);
  };

  const toggleTimeSelection = (time) => {
    setSelectedTimes((prevTimes) =>
      prevTimes.includes(time)
        ? prevTimes.filter((t) => t !== time)
        : [...prevTimes, time]
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
  
    // ✅ Ensure selectedDate is formatted properly
    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
  
    // ✅ Log Data Before Sending
    console.log("🔹 Sending Data:", {
      date: formattedDate,
      times: selectedTimes.map(time => time.trim()),
    });
  
    const payload = {
      date: formattedDate, // ✅ Ensure this is a string and not an object
      times: selectedTimes.map(time => time.trim()), // ✅ Ensure times are strings
    };
  
    try {
      const response = await axios.put(`${API_BASE_URL}/api/admin/update-availability`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
  
      console.log("✅ Response from Server:", response.data);
      Alert.alert("Success", "Availability updated successfully!");
      fetchAllAvailability();
    } catch (error) {
      console.error("❌ Error setting availability:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to set availability. Please try again.");
    }
  };
  
  const deleteAvailability = async () => {
    const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/delete-availability`, {
        headers: { Authorization: `Bearer ${user.token}` },
        data: { date: formattedDate },
      });
      Alert.alert("Success", "Availability deleted successfully!");
      fetchAllAvailability();
      setSelectedTimes([]);
    } catch (error) {
      console.error("❌ Error deleting availability:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to delete availability. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={true} home={true} title={'Manage Availability'} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Existing Availability:</Text>
        <View style={styles.inlineRow}>
          {availableDates.length > 0 ? (
            availableDates.map((date) => (
              <Text key={date} style={styles.dateItem}>📅 {moment(date).format("ddd, MMM D")}</Text>
            ))
          ) : (
            <Text>No availability set.</Text>
          )}
        </View>

        <Button title="Select Date" onPress={() => setShowDatePicker(true)} />
        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} />
        )}
        <Text style={styles.selectedDate}>Selected Date: {selectedDate.toDateString()}</Text>

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
