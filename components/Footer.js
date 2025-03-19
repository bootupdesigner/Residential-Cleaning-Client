import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth"; 
const Footer = () => {
  const router = useRouter();
  const { isAuthenticated, handleLogout } = useAuth(); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated ?? false); 
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <View style={styles.container}>
          <Text onPress={() => router.push("/privacy-policy")}>Privacy Policy</Text>
          <Text onPress={() => router.push("/user-profile")}>Profile</Text>
          <Text onPress={handleLogout} style={styles.logoutText}>Logout</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={{ color: 'black' }} onPress={() => router.push("/privacy-policy")}>Privacy Policy</Text>
          <Text style={{ color: 'black' }} onPress={() => router.push("/signin")}>Sign In</Text>
        </View>
      )}
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    alignContent: "center",
    backgroundColor: "orange",
  },
  logoutText: { color: "red", fontWeight: "bold" },
});
