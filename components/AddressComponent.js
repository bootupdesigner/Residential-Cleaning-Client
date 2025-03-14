import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import {Picker} from '@react-native-picker/picker';
const AddressComponent = ({ address, setAddress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Street Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Street Address"
        value={address.street}
        onChangeText={(text) => setAddress({ ...address, street: text })}
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="City"
        value={address.city}
        onChangeText={(text) => setAddress({ ...address, city: text })}
      />

      <Text style={styles.label}>State</Text>
      <TextInput
        style={styles.input}
        placeholder="State"
        value={address.state}
        onChangeText={(text) => setAddress({ ...address, state: text })}
      />

      <Text style={styles.label}>Zip Code</Text>
      <TextInput
        style={styles.input}
        placeholder="Zip Code"
        keyboardType="numeric"
        value={address.zipCode}
        onChangeText={(text) => setAddress({ ...address, zipCode: text })}
      />

      <Text style={styles.label}>Home Type</Text>
      <Picker
        selectedValue={address.homeType}
        onValueChange={(itemValue) => setAddress({ ...address, homeType: itemValue })}
      >
        <Picker.Item label="Apartment" value="apartment" />
        <Picker.Item label="House" value="house" />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontSize: 16, marginBottom: 5, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
});

export default AddressComponent;
