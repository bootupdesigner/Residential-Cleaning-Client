import React, { useState, useEffect } from "react";
import { View, Text, Button, SafeAreaView, ScrollView, StyleSheet, Alert, Platform } from "react-native";
import AddressComponent from "../components/AddressComponent";
import HomeSizeComponent from "../components/HomeSizeComponent";
import ContactInfoComponent from "../components/ContactInfoComponent";
import axios from "axios";
import { useAuth } from "../hooks/useAuth"; // ✅ Import useAuth
import { useRouter } from "expo-router";
import Header from "../components/Header";

const API_BASE_URL = Platform.OS === "android" || "ios" ? "http://10.0.0.191:5000" : "http://localhost:5000";

const SignUp = () => {
    const router = useRouter();
    const { user, login, checkAuthStatus } = useAuth(); // ✅ Use login & checkAuthStatus

    const [address, setAddress] = useState({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        homeType: "apartment",
    });

    const [homeSize, setHomeSize] = useState({
        bedrooms: 1,
        bathrooms: 1,
    });

    const [contactInfo, setContactInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
    });

    // **Redirect if user is already logged in**
    useEffect(() => {
        if (user) {
            router.replace("/user-profile");
        }
    }, [user]);

    const handleSignUp = async () => {
        try {
            if (!contactInfo.email || !contactInfo.password) {
                Alert.alert("Error", "Please fill in all required fields.");
                return;
            }

            const payload = {
                firstName: contactInfo.firstName.trim(),
                lastName: contactInfo.lastName.trim(),
                email: contactInfo.email.trim(),
                phone: contactInfo.phone.trim(),
                password: contactInfo.password,
                serviceAddress: address.street.trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                zipCode: String(address.zipCode), // ✅ Ensure it's a string
                homeType: address.homeType.trim(),
                homeSize: {
                    bedrooms: parseInt(homeSize.bedrooms, 10), // ✅ Convert safely to integer
                    bathrooms: parseInt(homeSize.bathrooms, 10), // ✅ Convert safely to integer
                }
            };

            console.log("🔹 Sign Up Payload:", payload);

            const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, payload);

            console.log("✅ Sign Up Successful:", response.data);

            // ✅ Auto-Login After Signup
            const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email: contactInfo.email,
                password: contactInfo.password
            });

            const { token } = loginResponse.data;
            await login(token); // ✅ Use login() from useAuth
            checkAuthStatus(); // ✅ Ensure Footer updates

            console.log("✅ Auto-Login Successful");
            Alert.alert("Success", "Account created successfully!");

            router.push("/user-profile"); // ✅ Redirect to Profile
        } catch (error) {
            console.error("❌ Sign Up Error:", error.response?.data || error.message);
            Alert.alert("Error", "Account creation failed. Please try again.");
        }
    };



    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Header back={true} home={true} title={'Sign UP'} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>Sign Up</Text>

                <AddressComponent address={address} setAddress={setAddress} />
                <HomeSizeComponent homeSize={homeSize} setHomeSize={setHomeSize} />
                <ContactInfoComponent contactInfo={contactInfo} setContactInfo={setContactInfo} />

                <Button title="Create Account" onPress={handleSignUp} />
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
});

export default SignUp;
