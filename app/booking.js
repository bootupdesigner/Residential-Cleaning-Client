import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Button, Alert, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Platform, SafeAreaView } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { getAuthHeaders } from "../utils/authUtils";
import Header from "../components/Header";
import { API_BASE_URL } from "../config";

const Booking = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [allAvailability, setAllAvailability] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [ceilingFanCount, setCeilingFanCount] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Define add-ons list
  const addOnsList = [
    { id: "windows", name: "Window Cleaning", price: 10 },
    { id: "stove", name: "Stove/Oven Cleaning", price: 15 },
    { id: "ceiling_fan", name: "Ceiling Fan Cleaning", price: 5 },
  ];

  const toggleAddOn = (addOn) => {
    setSelectedAddOns((prev) => {
      if (addOn.id === "ceiling_fan") return prev; // Prevent toggling this one manually
      return prev.includes(addOn.id) ? prev.filter((id) => id !== addOn.id) : [...prev, addOn.id];
    });
  };

  const calculateTotalPrice = () => {
    if (!user) return 0;
    const basePrice = user.cleaningPrice || 0;

    const addOnsPrice = addOnsList
      .filter((addOn) => selectedAddOns.includes(addOn.id))
      .reduce((total, addOn) => total + addOn.price, 0);

    // ✅ Calculate ceiling fan price separately
    const ceilingFanPrice = ceilingFanCount * 5;

    return basePrice + addOnsPrice + ceilingFanPrice;
  };

  const confirmBookingWithPayment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Error", "Please select a date and time.");
      return;
    }
  
    // ✅ Ensure user is loaded before proceeding
    if (!user || !user.id) {
      console.error("❌ User data is missing:", user);
      Alert.alert("Error", "User data is missing. Please log in again.");
      return;
    }
  
    const userId = user.id; // ✅ Ensure userId is included in the request
  
    // ✅ Re-fetch availability to ensure time is still available
    await fetchAvailableTimes(selectedDate);
  
    if (!availableTimes.some(timeObj => timeObj.value === selectedTime)) {
      Alert.alert("Error", "Selected time is no longer available. Please choose another time.");
      return;
    }
  
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const token = await SecureStore.getItemAsync("authToken");
  
    if (!token) {
      Alert.alert("Error", "No authentication token found. Please sign in again.");
      return;
    }
  
    try {
      console.log("🔹 Initiating Payment Request...");
  
      const totalPrice = calculateTotalPrice();
  
      // ✅ Step 1: Request Payment Intent from Backend
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/payment/pay`,
        {
          userId, // ✅ Ensure `userId` is included
          selectedAddOns,
          ceilingFanCount,
          totalPrice,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const { clientSecret, ephemeralKey, customer } = paymentResponse.data;
      console.log("✅ Received Stripe Payment Data:", paymentResponse.data);
  
      // ✅ Step 2: Initialize the Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: "JMAC Cleaning Services",
      });
  
      if (initError) {
        console.error("❌ Stripe Payment Sheet Initialization Error:", initError.message);
        Alert.alert("Payment failed", initError.message);
        return;
      }
  
      // ✅ Step 3: Present the Stripe Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();
  
      if (paymentError) {
        console.error("❌ Stripe Payment Error:", paymentError.message);
        Alert.alert("Payment failed", paymentError.message);
        return;
      }
  
      console.log("✅ Payment Successful!");
  
      // ✅ Step 4: Confirm the Booking AFTER Payment
      console.log("🔹 Initiating Booking Request...");
  
      const bookingPayload = {
        selectedDate: formattedDate,
        selectedTime,
        userId, // ✅ Ensure `userId` is correctly passed
        addOns: selectedAddOns,
      };
  
      console.log("🔹 Booking Payload:", bookingPayload);
  
      const bookingResponse = await axios.post(
        `${API_BASE_URL}/api/bookings/book`,
        bookingPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("✅ Booking Successful:", bookingResponse.data);
      Alert.alert("Success", "Your booking has been confirmed!");
  
      // ✅ Refresh available times after successful booking
      fetchAvailableTimes(selectedDate);
  
      // Redirect to booking confirmed screen
      router.push({
        pathname: "/booking-confirmed",
        params: {
          bookingId: bookingResponse.data.booking._id,
          selectedDate: formattedDate,
          selectedTime: selectedTime,
        },
      });
  
    } catch (error) {
      console.error("❌ Booking or Payment Error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "An error occurred. Please try again.");
    }
  };
  
  
  // **Fetch User Profile**
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) {
          console.error("❌ No auth token found. Redirecting to login...");
          router.push("/signin");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/users/profile`, { headers });

        if (response.status === 200) {
          console.log("✅ User Data:", response.data);
          setUser(response.data); // ✅ Store user object as-is
        } else {
          console.error("❌ Error: Invalid response status:", response.status);
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error.response?.data || error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);


  // Fetch all availability once on component load
  useEffect(() => {
    const fetchAllAvailability = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        console.error("❌ No auth token found. Cannot fetch availability.");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/get-availability`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ Full API Response:", response.data);

        let availability = response.data.availability;

        // ✅ Ensure availability is an object
        if (!availability || typeof availability !== "object") {
          console.error("❌ No availability data received.");
          setAvailableDates([]);
          return;
        }

        // ✅ Ensure availability contains valid dates
        const datesWithAvailability = Object.keys(availability).filter(
          (date) => Array.isArray(availability[date]) && availability[date].length > 0
        );

        setAllAvailability(availability);
        setAvailableDates(datesWithAvailability);
      } catch (error) {
        console.error("❌ Error fetching availability:", error.response?.data || error.message);
        setAvailableDates([]);
      }
    };

    fetchAllAvailability();
  }, []);


  // Fetch available times for a selected date
  const fetchAvailableTimes = async (dateString) => {
    if (!allAvailability[dateString]) {
      setAvailableTimes([]);
      return;
    }
  
    // ✅ Fetch availability from backend
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/admin/get-availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const updatedAvailability = response.data.availability;
      console.log("✅ Updated Availability:", updatedAvailability);
  
      // ✅ Ensure only available times are shown
      setAllAvailability(updatedAvailability);
      setAvailableTimes(
        updatedAvailability[dateString]?.map(time => ({ label: time, value: time })) || []
      );
    } catch (error) {
      console.error("❌ Error fetching updated availability:", error.response?.data || error.message);
    }
  };
  


  // Clear selected time when the date changes
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate]);

  // **Handle Date Selection**
  const handleDateChange = (event, date) => {
    if (!date) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent selection of past dates
    if (date < today) {
      Alert.alert("Error", "You cannot select a past date. Please choose a future date.", [
        { text: "OK", onPress: () => setTimeout(() => setShowDatePicker(false), 500) }
      ]);
      return;
    }

    // Format selected date
    const formattedDate = date.toISOString().split("T")[0];
    console.log(`🔹 User selected date: ${formattedDate}`);

    // Check if the selected date has availability
    if (!availableDates.includes(formattedDate)) {
      Alert.alert("Error", "No availability for the selected date. Please choose another date.", [
        { text: "OK", onPress: () => setTimeout(() => setShowDatePicker(false), 500) }
      ]);
      return;
    }

    // Set the date and fetch available times
    setSelectedDate(date);
    fetchAvailableTimes(formattedDate);
    setShowDatePicker(false);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="blue" />;
  }
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={true} title='Schedule a Cleaning' home={true} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: 'orange', textAlign: 'center', }}>Book Your Cleaning</Text>

        {user && (
          <>
            <Text>🏠 Home Size: {user.homeSize?.bedrooms || 0} Bedrooms, {user.homeSize?.bathrooms || 0} Bathrooms</Text>
            <Text>📍 Service Address: {user.serviceAddress}, {user.city}, {user.state}, {user.zipCode}</Text>
            <Text>💰 Base Price: ${user.cleaningPrice || 0}</Text>
          </>
        )}

        <Text style={{ color: 'orange', fontSize: 18.72, fontWeight: "bold", marginTop: 15 }}>📅 Select a Date:</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ marginVertical: 10, padding: 15, backgroundColor: "#ddd", borderRadius: 5 }}>
          <Text>{selectedDate ? new Date(selectedDate).toDateString() : "Select a Date"}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            onChange={handleDateChange}
            minimumDate={new Date()}
            display="default"
          />
        )}

        <Text style={{ color: 'orange', fontSize: 18.72, fontWeight: "bold", marginTop: 15 }}>⏰ Select a Time:</Text>
        <View style={{ marginVertical: 10 }}>
          <Dropdown
            data={availableTimes}
            labelField="label"
            valueField="value"
            placeholder="Select Time"
            value={selectedTime}
            onChange={(item) => setSelectedTime(item.value)}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 5,
            }}
            disable={availableTimes.length === 0}
          />
        </View>


        <Text style={{ fontWeight: "bold", marginTop: 15, color: 'orange', fontSize: 16 }}>🛠 Add-on Services:</Text>
        {addOnsList.map((addOn) => (
          <TouchableOpacity key={addOn.id} onPress={() => toggleAddOn(addOn)} style={{ flexDirection: "row", alignItems: "center", marginVertical: 5 }}>
            <Text style={{ fontSize: 16 }}>{selectedAddOns.includes(addOn.id) ? "✅" : "⬜"} {addOn.name} (+${addOn.price})</Text>
          </TouchableOpacity>
        ))}

        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
          <Text style={{ fontSize: 16 }}>🌀 Ceiling Fans:</Text>
          <TextInput
            style={{ marginLeft: 10, borderBottomWidth: 1, width: 50, textAlign: "center" }}
            keyboardType="numeric"
            value={String(ceilingFanCount)}
            onChangeText={(text) => setCeilingFanCount(Math.max(0, parseInt(text) || 0))}
          />
        </View>


        {selectedDate && selectedTime && (
          <View style={{ marginVertical: 20, padding: 15, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
            <Text style={{ fontSize: 16 }}>📅 Date: {selectedDate.toDateString()}</Text>
            <Text style={{ fontSize: 16 }}>⏰ Time: {selectedTime}</Text>
          </View>
        )}

        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 15 }}>💵 Total Price: ${calculateTotalPrice()}</Text>

        <Button
          title="Confirm Booking"
          onPress={confirmBookingWithPayment}
          disabled={!selectedDate || !selectedTime}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Booking;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
})