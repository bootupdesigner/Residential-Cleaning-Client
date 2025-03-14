import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";

const API_BASE_URL = Platform.OS === "android" || "ios" ? "http://10.0.0.191:5000" : "http://localhost:5000";

const PreviousBookings = () => {
  const { user } = useAuth();
  const [pastBookings, setPastBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync("authToken");
    if (!token) {
      console.error("❌ No auth token found!");
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

  const convertTo24HourFormat = (time) => {
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":");

    if (period === "PM" && hours !== "12") {
      hours = String(parseInt(hours, 10) + 12);
    } else if (period === "AM" && hours === "12") {
      hours = "00";
    }

    return `${hours}:${minutes}:00`; // ✅ Ensures proper `HH:mm:ss` format
  };

  const fetchPastBookings = async () => {
    const headers = await getAuthHeaders();
    const endpoint = user.role === "admin" ? "/api/bookings/all" : "/api/bookings/user-bookings";

    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, { headers });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ✅ Sort and filter past bookings
      const sortedPastBookings = response.data.bookings
        .map((booking) => ({
          ...booking,
          dateTime: new Date(`${booking.date}T${convertTo24HourFormat(booking.time)}`),
        }))
        .filter((booking) => booking.dateTime < today) // ✅ Only past appointments
        .sort((a, b) => b.dateTime - a.dateTime); // ✅ Newest to oldest

      console.log("✅ Past Bookings:", sortedPastBookings);
      setPastBookings(sortedPastBookings);
    } catch (error) {
      console.error("❌ Error fetching past bookings:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPastBookings();
  }, [user]);

  if (isLoading) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={true} home={true} title="Previous Bookings" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {pastBookings.length === 0 ? (
          <Text style={styles.noAppointments}>No previous appointments found.</Text>
        ) : (
          pastBookings.map((booking, index) => (
            <View key={index} style={styles.appointmentCard}>
              <Text style={styles.date}>{new Date(booking.date).toDateString()}</Text>
              <Text style={styles.time}>⏰ Time: {booking.time}</Text>
              <Text style={styles.address}>📍 {booking.serviceAddress}, {booking.city}, {booking.state} {booking.zipCode}</Text>
              <Text style={styles.user}>👤 {booking.user?.firstName} {booking.user?.lastName} ({booking.user?.email || "Unknown User"})</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PreviousBookings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  noAppointments: {
    fontSize: 18,
    textAlign: "center",
    color: "#888",
    marginTop: 50,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  date: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#444",
  },
  time: {
    fontSize: 18,
    color: "#555",
    marginVertical: 5,
  },
  address: {
    fontSize: 16,
    color: "#666",
  },
  user: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
    color: "#333",
  },
});
