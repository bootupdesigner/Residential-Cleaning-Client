// components/HomeSizeComponent.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {Picker} from '@react-native-picker/picker';

const HomeSizeComponent = ({ homeSize, setHomeSize }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Bedrooms</Text>
      <Picker
        selectedValue={homeSize.bedrooms}
        onValueChange={(value) => setHomeSize({ ...homeSize, bedrooms: value })}
      >
        <Picker.Item label="1" value={"1"} />
        <Picker.Item label="2" value={"2"} />
        <Picker.Item label="3" value={"3"} />
        <Picker.Item label="4" value={"4"} />
      </Picker>

      <Text style={styles.label}>Bathrooms</Text>
      <Picker
        selectedValue={homeSize.bathrooms}
        onValueChange={(value) => setHomeSize({ ...homeSize, bathrooms: value })}
      >
        <Picker.Item label="1" value={"1"} />
        <Picker.Item label="2" value={"2"} />
        <Picker.Item label="3" value={"3"} />
        <Picker.Item label="4" value={"4"} />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { fontSize: 16, marginBottom: 5, color: "#333" },
});

export default HomeSizeComponent;
