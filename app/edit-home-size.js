import React, { useState, useEffect } from "react";
import { View, Text, Button, SafeAreaView, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import HomeSizeComponent from "../components/HomeSizeComponent";
import { useAuth } from "../hooks/useAuth"; // ✅ Import useAuth
import Header from "../components/Header";
import * as SecureStore from "expo-secure-store"; // ✅ Import SecureStore
import { API_BASE_URL } from "../config";

const EditHomeSize = () => {
  const router = useRouter();
  const { user, refreshUser } = useAuth(); // ✅ Use global user state
  const [isLoading, setIsLoading] = useState(true);
  const [homeSize, setHomeSize] = useState({
    bedrooms: user?.homeSize?.bedrooms || 1, // ✅ Default to 1 if missing
    bathrooms: user?.homeSize?.bathrooms || 1, // ✅ Default to 1 if missing
  });

  useEffect(() => {
    if (user) {
      setHomeSize({
        bedrooms: user.homeSize.bedrooms,
        bathrooms: user.homeSize.bathrooms,
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleUpdateHomeSize = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        Alert.alert("Error", "Authentication error. Please sign in again.");
        router.push("/signin");
        return;
      }
  
      const headers = { Authorization: `Bearer ${token}` };
  
      // ✅ Ensure payload contains valid values
      const payload = {
        homeSize: {
          bedrooms: homeSize.bedrooms > 0 ? homeSize.bedrooms : 1, // ✅ Prevents sending 0
          bathrooms: homeSize.bathrooms > 0 ? homeSize.bathrooms : 1,
        },
      };
  
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, payload, { headers });
  
      console.log("✅ Home Size Updated:", response.data);
      Alert.alert("Success", "Home size updated successfully!");
  
      await refreshUser();
      router.push("/user-profile");
  
    } catch (error) {
      console.error("❌ Update Error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Home size update failed. Please try again.");
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
        <Header back={true} home={true} title={'Edit Home Size'} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <HomeSizeComponent homeSize={homeSize} setHomeSize={setHomeSize} />

        <Button title="Update Home Size" onPress={handleUpdateHomeSize} />
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

export default EditHomeSize;
