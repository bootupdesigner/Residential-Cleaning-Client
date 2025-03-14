import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Platform, TouchableOpacity, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
const API_BASE_URL = Platform.OS === "android" || "ios" ? "http://10.0.0.191:5000" : "http://localhost:5000";

const Appointments = () => {
const router=useRouter();

  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
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
  
  const fetchBookings = async () => {
    const headers = await getAuthHeaders();
    const endpoint = user.role === "admin" ? "/api/bookings/all" : "/api/bookings/user-bookings";
  
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, { headers });
      console.log("✅ Bookings before sorting:", response.data);
  
      // ✅ Get today's date (without time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      // ✅ Convert date & time into valid `Date` objects
      const sortedBookings = response.data.bookings
        .map((booking) => ({
          ...booking,
          dateTime: new Date(`${booking.date}T${convertTo24HourFormat(booking.time)}`),
        }))
        .filter((booking) => booking.dateTime >= today) // ✅ Remove past appointments
        .sort((a, b) => a.dateTime - b.dateTime);
  
      console.log("✅ Sorted Bookings:", sortedBookings);
      setBookings(sortedBookings);
    } catch (error) {
      console.error("❌ Error fetching bookings:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleCancelBooking = async (bookingId) => {
    const headers = await getAuthHeaders();

    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(`${API_BASE_URL}/api/bookings/cancel/${bookingId}`, { headers });
              console.log("✅ Booking Cancelled:", response.data);

              // Update UI after successful cancellation
              setBookings(prevBookings => prevBookings.filter(booking => booking._id !== bookingId));
              Alert.alert("Success", "Appointment has been canceled.");
            } catch (error) {
              console.error("❌ Error canceling booking:", error.response?.data || error.message);
              Alert.alert("Error", "Cancellation failed. Please try again.");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  if (isLoading) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={true} home={true} title='Appointments' />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {bookings.length === 0 ? (
          <Text style={styles.noAppointments}>No appointments found.</Text>
        ) : (
          bookings.map((booking, index) => (
            <View key={index} style={styles.appointmentCard}>
              <Text style={styles.date}>{new Date(booking.date).toDateString()}</Text>
              <Text style={styles.time}>⏰ Time: {booking.time}</Text>
              <Text style={styles.address}>📍 {booking.serviceAddress}, {booking.city}, {booking.state} {booking.zipCode}</Text>

              {/* ✅ Check if booking.user exists before accessing properties */}
              {booking.user ? (
                <Text style={styles.user}>👤 {booking.user.firstName} {booking.user.lastName} ({booking.user.email})</Text>
              ) : (
                <Text style={styles.user}>👤 Unknown User</Text>
              )}

              <TouchableOpacity
                onPress={() => handleCancelBooking(booking._id)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <TouchableOpacity
          onPress={() => router.push("/previous-bookings")}
          style={{ backgroundColor: "#ff9800", padding: 15, borderRadius: 5, marginBottom: 20 }}
        >
          <Text style={{ textAlign: "center", color: "white", fontSize: 18 }}>View Previous Appointments</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Appointments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
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
  cancelButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  }
});
