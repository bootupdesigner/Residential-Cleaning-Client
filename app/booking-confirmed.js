import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter,  } from "expo-router";
import axios from "axios";


// ✅ Import getAuthHeaders from utility file
import { getAuthHeaders } from "../utils/authUtils";
import Header from "../components/Header";

const BookingConfirmed = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Get selectedDate and selectedTime from URL parameters
  const { selectedDate, selectedTime } = useLocalSearchParams();

  const API_BASE_URL =
    Platform.OS === "android" || Platform.OS === "ios"
      ? "http://10.0.0.191:5000"
      : "http://localhost:5000";

  // ✅ Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) {
          console.error("❌ No auth token found. Redirecting to login...");
          router.push("/signin");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
          headers,
        });

        console.log("✅ User Data:", response.data);

        if (response.status === 200) {
          setUser(response.data);
        } else {
          console.error("❌ Error: Invalid response status:", response.status);
          setUser(null);
        }
      } catch (error) {
        console.error(
          "❌ Error fetching user data:",
          error.response?.data || error.message
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // ✅ Loading State
  if (isLoading) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  // ✅ Error State
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          User data not found. Please try again.
        </Text>
      </SafeAreaView>
    );
  }

  // ✅ Format Date
  const formattedDate = selectedDate
    ? new Date(selectedDate).toDateString()
    : "No Date Selected";

  // ✅ Format Time
  const formattedTime = selectedTime || "No Time Selected";

  return (
    <SafeAreaView style={styles.container}>
      <View >
        <Header back={false}title='Booking Confirmation' home={true} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <FontAwesome name="check-circle" size={28} color="green" />
          <Text style={styles.headerText}>Booking Confirmed</Text>
        </View>

        <Text style={styles.thankYouText}>
          Thank you for your booking, {user.firstName}!
        </Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Appointment Details</Text>

          <View style={styles.detailRow}>
            <FontAwesome name="map-marker" size={24} color="black" />
            <Text style={styles.detailText}>{user.serviceAddress}</Text>
          </View>

          <View style={styles.detailRow}>
            <FontAwesome name="map" size={24} color="black" />
            <Text style={styles.detailText}>
              {user.city}, {user.state} {user.zipCode}
            </Text>
          </View>

          <View style={styles.detailRow}>
            {user.homeType === "house" ? (
              <FontAwesome6 name="house" size={24} color="black" />
            ) : (
              <MaterialIcons name="apartment" size={24} color="black" />
            )}
            <Text style={styles.detailText}>
              {user.homeType
                ? user.homeType.charAt(0).toUpperCase() +
                user.homeType.slice(1)
                : "Unknown"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <FontAwesome name="calendar" size={24} color="black" />
            <Text style={styles.detailText}>{formattedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <FontAwesome name="clock-o" size={24} color="black" />
            <Text style={styles.detailText}>{formattedTime}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingConfirmed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    padding: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    marginLeft: 10,
    color: "green",
  },
  thankYouText: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 10,
    color: "#333",
  },
  detailsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#444",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  detailText: {
    fontSize: 18,
    marginLeft: 10,
    color: "#555",
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    color: "red",
    marginTop: 50,
  },
});
