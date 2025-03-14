import React, { useState, useEffect } from "react";
import { View, Text, Button, SafeAreaView, ScrollView, StyleSheet, Alert, ActivityIndicator,Platform } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import AddressComponent from "../components/AddressComponent";
import { useAuth } from "../hooks/useAuth"; // ✅ Import useAuth
import Header from "../components/Header";
import * as SecureStore from "expo-secure-store"; // ✅ Import SecureStore

const API_BASE_URL =
    Platform.OS === "android" || Platform.OS === "ios"
      ? "http://10.0.0.191:5000"
      : "http://localhost:5000";


const EditAddress = () => {
  const router = useRouter();
  const { user, refreshUser } = useAuth(); // ✅ Use global user state
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState({
    street: user?.serviceAddress || "", // ✅ Use fallback if missing
    city: user?.city || "",
    state: user?.state || "",
    zipCode: user?.zipCode || "",
    homeType: user?.homeType || "apartment",
  });

  useEffect(() => {
    if (user) {
      setAddress({
        street: user.serviceAddress,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        homeType: user.homeType,
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleUpdateAddress = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        Alert.alert("Error", "Authentication error. Please sign in again.");
        router.push("/signin");
        return;
      }
  
      const headers = { Authorization: `Bearer ${token}` };
  
      // ✅ Ensure payload only contains valid values
      const payload = {};
      if (address.street) payload.serviceAddress = address.street;
      if (address.city) payload.city = address.city;
      if (address.state) payload.state = address.state;
      if (address.zipCode) payload.zipCode = address.zipCode;
      if (address.homeType) payload.homeType = address.homeType;
  
      if (Object.keys(payload).length === 0) {
        Alert.alert("Error", "No valid fields provided for update.");
        return;
      }
  
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, payload, { headers });
  
      console.log("✅ Address Updated:", response.data);
      Alert.alert("Success", "Address updated successfully!");
  
      await refreshUser();
      router.push("/user-profile");
  
    } catch (error) {
      console.error("❌ Update Error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Address update failed. Please try again.");
    }
  };
  

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>User data not found. Please sign in again.</Text>
        <Button title="Sign In" onPress={() => router.push("/signin")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={true} home={true} title={'Edit Address'} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AddressComponent address={address} setAddress={setAddress} />

        <Button title="Update Address" onPress={handleUpdateAddress} />
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
  errorText: { textAlign: "center", color: "red", fontSize: 18, marginTop: 20 },
});

export default EditAddress;
