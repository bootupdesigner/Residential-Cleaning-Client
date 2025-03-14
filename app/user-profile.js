import React, { useState, useCallback } from "react";
import { Alert, Platform, View, Text, Button, SafeAreaView, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useFocusEffect } from "@react-navigation/native"; // ✅ Import useFocusEffect
import Header from "../components/Header";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const UserProfile = () => {
  const router = useRouter();
  const { user, refreshUser, handleLogout } = useAuth(); // ✅ Ensure refreshUser is available
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL =
    Platform.OS === "android" || Platform.OS === "ios"
      ? "http://10.0.0.191:5000"
      : "http://localhost:5000";

  // ✅ Check if refreshUser exists before calling it
  useFocusEffect(
    useCallback(() => {
      if (refreshUser) {
        refreshUser();
      }
    }, [refreshUser])
  );

  const handleDeleteProfile = async () => {
    console.log("🚀 Delete Profile button clicked!");

    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete your account? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);

              console.log("🔹 Fetching auth token...");
              const token = await SecureStore.getItemAsync("authToken");

              if (!token) {
                console.error("❌ No auth token found!");
                Alert.alert("Error", "Authentication failed. Please sign in again.");
                return;
              }

              console.log("✅ Token retrieved:", token);
              const headers = { Authorization: `Bearer ${token}` };

              console.log("🔹 Sending DELETE request to API...");
              const response = await axios.delete(`${API_BASE_URL}/api/users/profile`, { headers });

              console.log("✅ Profile Deleted:", response.data);
              Alert.alert("Success", "Your profile has been deleted.");

              // ✅ Remove auth token
              await SecureStore.deleteItemAsync("authToken");
              console.log("✅ Auth token removed.");

              // ✅ Check if handleLogout exists before calling it
              console.log("🔹 handleLogout function:", handleLogout);
              if (typeof handleLogout === "function") {
                await handleLogout();
                console.log("✅ User logged out.");
              } else {
                console.error("❌ handleLogout is not a function!");
              }

              // ✅ Redirect to home
              console.log("✅ Redirecting to home page...");
              router.replace("/");

            } catch (error) {
              console.error("❌ Error deleting profile:", error.response?.data || error.message);
              Alert.alert("Error", error.response?.data?.message || "Failed to delete your profile. Please try again.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>User data not found. Please try again.</Text>
        <Button title="Sign In" onPress={() => router.push("/signin")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingHorizontal: 30, paddingVertical: 20 }}>
        <Header home={true} back={true} title='Profile' />
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/appointments")}
        >
          <Text style={styles.linkText}>View Appointments</Text>
        </TouchableOpacity>

        {user.role === "admin" && (
          <>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push("/create-availability")}
            >
              <Text style={styles.linkText}>Manage Availability</Text>
            </TouchableOpacity>
          </>
        )}

        <View>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user.firstName} {user.lastName}</Text>
        </View>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>

        <View style={styles.profileRow}>
          <View>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{user.phone}</Text>
          </View>
          <Text onPress={() => router.push("/edit-profile")} style={styles.editText}>Edit</Text>
        </View>
        <Text style={styles.label}>Address:</Text>
        <Text style={styles.value}>{user.serviceAddress}, {user.city}, {user.state} {user.zipCode}</Text>

        <View style={styles.profileRow}>
          <View>
            <Text style={styles.label}>Home Type:</Text>
            <Text style={styles.value}>{user.homeType.charAt(0).toUpperCase() + user.homeType.slice(1)}</Text>
          </View>
          <Text onPress={() => router.push("/edit-address")} style={styles.editText}>Edit</Text>
        </View>

        <View style={styles.profileRow}>
          <View>
            <Text style={styles.label}>Home Size:</Text>
            <Text style={styles.value}>{user.homeSize.bedrooms} Bedrooms, {user.homeSize.bathrooms} Bathrooms</Text>
          </View>
          <Text onPress={() => router.push("/edit-home-size")} style={styles.editText}>Edit</Text>
        </View>

        <Text style={styles.label}>Base Price:</Text>
        <Text style={styles.value}>${user.cleaningPrice || 0}</Text>

        <TouchableOpacity onPress={handleDeleteProfile} style={styles.deleteButton}>
          {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.deleteText}>Delete Profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
  header: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  value: { fontSize: 18, marginBottom: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1, marginBottom: 10 },
  editText: { color: 'blue', textDecorationLine: 'underline' },
  linkButton: {
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginTop: 20,
  },
  linkText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
  },
  errorText: { textAlign: 'center', color: 'red', fontSize: 18, marginTop: 20 },
  deleteButton: { backgroundColor: "red", padding: 15, borderRadius: 5, marginTop: 20, alignItems: "center" },
  deleteText: { color: "white", fontSize: 18 },

});

export default UserProfile;
