import { Text, View, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions, Image, Platform, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";


export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null); // ✅ Store user data


  const API_BASE_URL =
  Platform.OS === "android" || Platform.OS === "ios"
    ? "http://10.0.0.191:5000"
    : "http://localhost:5000";

  // ✅ Get Screen Width to Maintain 16:9 Aspect Ratio
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = (screenWidth * 9) / 16; // ✅ Calculate 16:9 height

  // ✅ Load User Data if Token Exists
  const loadUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        console.log("❌ No token found.");
        setUser(null);
        return;
      }
  
      console.log("🔑 Using Token:", token);
  
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, { headers });
  
      console.log("✅ API Response:", response.data);
  
      if (response.status === 200 && response.data) {
        setUser(response.data);
      } else {
        console.log("❌ Invalid response status:", response.status);
        setUser(null);
      }
    } catch (error) {
      console.log("❌ Error fetching user data:", error.response?.data || error.message);
      setUser(null);
    }
  }; 

  useEffect(() => {
    // ✅ Load user data without redirecting
    loadUserData();
  }, []);

  const handleBookingPress = async () => {
    setIsLoading(true);

    // ✅ Retrieve token from SecureStore
    const token = await SecureStore.getItemAsync("authToken");

    if (token) {
      console.log("✅ User is logged in. Redirecting to Booking page.");
      router.push("/booking");
    } else {
      console.log("❌ No token found. Redirecting to Sign In page.");
      router.push("/signin");
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={false} home={false} title={'JMAC Cleaning Services'} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text>{user ? `Welcome, ${user.firstName}` : "Welcome to JMAC Cleaning Services"}</Text>


        <Text style={{ marginBottom: 20 }}>{`Residential cleaning - Houses, apartments, condos, and townhomes. Customize your cleaning experience with JMAC Cleaning Services starting at only $150 for your 1 bedroom / 1 bathroom home. ${user ? ('Book your next cleaning today.') : (' Sign up for an instant quote.')}`}</Text>

        <Image
          source={{ uri: "https://images.pexels.com/photos/4239067/pexels-photo-4239067.jpeg" }}
          style={{ width: screenWidth - 40, height: imageHeight, borderRadius: 10, marginBottom: 20 }}
          resizeMode="cover"
        />

        {user ? (
          <TouchableOpacity
            onPress={handleBookingPress}
            style={{
              backgroundColor: "#007bff",
              padding: 15,
              borderRadius: 5,
              marginBottom: 10,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ textAlign: 'center', width: 300, color: "white", fontSize: 18 }}>Book a Cleaning</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{}}>
            <TouchableOpacity
              onPress={() => router.push("/signup")}
              style={{
                backgroundColor: "#28a745",
                padding: 15,
                borderRadius: 5,
                marginBottom: 10,
              }}
            >
              <Text style={{ textAlign: 'center', width: 300, color: "white", fontSize: 18, }}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/signin")}
              style={{
                backgroundColor: "blue",
                padding: 15,
                borderRadius: 5,
                marginBottom: 10,
              }}
            >
              <Text style={{ textAlign: 'center', width: 300, color: "white", fontSize: 18 }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    padding: 20
  },
})