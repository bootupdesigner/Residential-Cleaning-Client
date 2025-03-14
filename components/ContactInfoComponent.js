import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

const ContactInfoComponent = ({ contactInfo, setContactInfo, showPassword = true }) => {
  const handleInputChange = (field, value) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={contactInfo.firstName}
        onChangeText={(value) => handleInputChange("firstName", value)}
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={contactInfo.lastName}
        onChangeText={(value) => handleInputChange("lastName", value)}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={contactInfo.email}
        onChangeText={(value) => handleInputChange("email", value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={contactInfo.phone}
        onChangeText={(value) => handleInputChange("phone", value)}
        keyboardType="phone-pad"
      />

      {showPassword && (
        <>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={contactInfo.password}
            onChangeText={(value) => handleInputChange("password", value)}
            secureTextEntry
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});

export default ContactInfoComponent;
