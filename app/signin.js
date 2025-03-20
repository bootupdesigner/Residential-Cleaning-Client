import React, { useState,useEffect } from "react";
import { View, TextInput, Button, Alert, ActivityIndicator, StyleSheet,SafeAreaView,ScrollView } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuth } from "../hooks/useAuth"; // ✅ Import useAuth
import Header from "../components/Header";
import { API_BASE_URL } from "../config";


const SignIn = () => {
  const router = useRouter();
  const { user,login } = useAuth(); // ✅ Use login from useAuth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

   // **Redirect if user is already logged in**
   useEffect(() => {
    if (user) {
      router.replace("/user-profile");
    }
  }, [user]);

  // **Handle Login**
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });

      if (response.data.token) {
        await login(response.data.token); 

        router.push("/booking");
      } else {
        Alert.alert("Login Failed", "Invalid response from server.");
      }
    } catch (error) {
      Alert.alert("Login Failed", error.response?.data?.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header back={true} home={true} title={'Sign In'} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
       <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="blue" />
        ) : (
          <Button title="Sign In" onPress={handleLogin} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10, marginBottom: 15,
    borderRadius: 5
  },
  signupText: {
    textAlign: "center",
    marginTop: 15,
    color: "blue"
  },
});
