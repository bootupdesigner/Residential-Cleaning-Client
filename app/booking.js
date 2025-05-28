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
    console.log("✅ Confirm Booking pressed");
  
    if (!selectedDate || !selectedTime) {
      console.warn("❌ Missing date or time:", { selectedDate, selectedTime });
      Alert.alert("Error", "Please select a date and time.");
      return;
    }
  
    if (!user || !user.id) {
      console.warn("❌ User missing or not loaded");
      Alert.alert("Error", "User data is missing. Please log in again.");
      return;
    }
  
    const userId = user.id;
    console.log("👤 User ID:", userId);
  
    // Fetch latest availability for this date
    console.log("📅 Checking availability for date:", selectedDate);
    await fetchAvailableTimes(selectedDate);
  
    if (!availableTimes.some(timeObj => timeObj.value === selectedTime)) {
      console.warn("❌ Time no longer available");
      Alert.alert("Error", "Selected time is no longer available.");
      return;
    }
  
    const formattedDate = selectedDate; // already in YYYY-MM-DD format from dropdown
    const token = await SecureStore.getItemAsync("authToken");
    if (!token) {
      console.warn("❌ No token found");
      Alert.alert("Error", "Please sign in again.");
      return;
    }
  
    try {
      const totalPrice = calculateTotalPrice();
      console.log("💰 Total Price:", totalPrice);
  
      // Step 1: Create Payment Intent
      console.log("🚀 Requesting payment intent...");
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/payment/pay`,
        {
          userId,
          selectedAddOns,
          ceilingFanCount,
          totalPrice,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("✅ Payment Intent Response:", paymentResponse.data);
  
      const { clientSecret, ephemeralKey, customer } = paymentResponse.data;
  
      // Step 2: Init Stripe Payment Sheet
      console.log("📦 Initializing Stripe Sheet...");
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: "JMAC Cleaning Services",
      });
  
      if (initError) {
        console.error("❌ Stripe Init Error:", initError);
        Alert.alert("Payment failed", initError.message);
        return;
      }
  
      // Step 3: Present Payment Sheet
      console.log("💳 Presenting Payment Sheet...");
      const { error: paymentError } = await presentPaymentSheet();
  
      if (paymentError) {
        console.error("❌ Payment Sheet Error:", paymentError);
        Alert.alert("Payment failed", paymentError.message);
        return;
      }
  
      // Step 4: Confirm Booking
      console.log("📅 Booking appointment...");
      const bookingResponse = await axios.post(
        `${API_BASE_URL}/api/bookings/book`,
        {
          selectedDate: formattedDate,
          selectedTime,
          userId,
          addOns: selectedAddOns,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("✅ Booking Successful:", bookingResponse.data);
  
      Alert.alert("Success", "Your booking has been confirmed!");
  
      fetchAvailableTimes(selectedDate);
  
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
          router.push("/signin");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/users/profile`, { headers });

        if (response.status === 200) {
          setUser(response.data); // ✅ Store user object as-is
        } else {
          setUser(null);
        }
      } catch (error) {
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
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/get-availability`, {
          headers: { Authorization: `Bearer ${token}` },
        });


        let availability = response.data.availability;

        // ✅ Ensure availability is an object
        if (!availability || typeof availability !== "object") {
          setAvailableDates([]);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const datesWithAvailability = Object.keys(availability).filter((date) => {
          const dateObj = new Date(date + "T00:00:00");
          return (
            Array.isArray(availability[date]) &&
            availability[date].length > 0 &&
            dateObj >= today
          );
        });        

        setAllAvailability(availability);
        setAvailableDates(datesWithAvailability);
      } catch (error) {
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

      // ✅ Ensure only available times are shown
      setAllAvailability(updatedAvailability);
      setAvailableTimes(
        updatedAvailability[dateString]?.map(time => ({ label: time, value: time })) || []
      );
    } catch (error) {
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
        <View style={{ marginVertical: 10 }}>
          <Dropdown
            data={availableDates.map((date) => ({
              label: new Date(date + "T00:00:00").toDateString(),
              value: date,
            }))}
            labelField="label"
            valueField="value"
            placeholder="Select a Date"
            value={selectedDate}
            onChange={(item) => {
              setSelectedDate(item.value);
              fetchAvailableTimes(item.value);
            }}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 5,
            }}
            disable={availableDates.length === 0}
          />
        </View>


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
            <Text style={{ fontSize: 16 }}>📅 Date: {new Date(selectedDate + "T00:00:00").toDateString()}</Text>
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