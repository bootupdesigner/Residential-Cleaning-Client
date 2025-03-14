import React, { useState, useEffect } from "react";
import { View, Text, Button, SafeAreaView, ScrollView, StyleSheet, Alert, ActivityIndicator,Platform } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import ContactInfoComponent from "../components/ContactInfoComponent";
import { useAuth } from "../hooks/useAuth";
import Header from "../components/Header";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
    Platform.OS === "android" || Platform.OS === "ios"
      ? "http://10.0.0.191:5000"
      : "http://localhost:5000";

const EditProfile = () => {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    if (user) {
      setContactInfo({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleUpdateContact = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        Alert.alert("Error", "Authentication error. Please sign in again.");
        router.push("/signin");
        return;
      }
  
      const headers = { Authorization: `Bearer ${token}` };
  
      // ✅ Ensure payload contains valid values
      const payload = {};
      if (contactInfo.firstName) payload.firstName = contactInfo.firstName;
      if (contactInfo.lastName) payload.lastName = contactInfo.lastName;
      if (contactInfo.email) payload.email = contactInfo.email;
      if (contactInfo.phone) payload.phone = contactInfo.phone;
  
      if (Object.keys(payload).length === 0) {
        Alert.alert("Error", "No valid fields provided for update.");
        return;
      }
  
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, payload, { headers });
  
      console.log("✅ Contact Info Updated:", response.data);
      Alert.alert("Success", "Contact information updated successfully!");
  
      await refreshUser();
      router.push("/user-profile");
  
    } catch (error) {
      console.error("❌ Update Error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Contact information update failed. Please try again.");
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
        <Header back={true} home={true} title={'Edit Contact Information'} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {contactInfo && (
          <ContactInfoComponent contactInfo={contactInfo} setContactInfo={setContactInfo} showPassword={false} />
        )}

        <Button title="Update Contact Info" onPress={handleUpdateContact} />
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
  header: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  errorText: { textAlign: "center", color: "red", fontSize: 18, marginTop: 20 },
});

export default EditProfile;
