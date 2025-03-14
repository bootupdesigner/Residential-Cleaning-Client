import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Entypo, Ionicons } from '@expo/vector-icons/';
import logo from '../assets/images/icon.png';

const Header = ({ back = false, home = false, title }) => {
  const router = useRouter();
  return (
    <View>
      <View style={styles.headerContainer}>
        {back ? (
          <Pressable onPress={() => router.back()} style={styles.iconWrapper}>
            <Ionicons name="arrow-back-circle" size={30} color="black" />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        <Image source={logo} style={styles.logo} />

        {home ? (
          <Pressable onPress={() => router.replace('/')} style={styles.iconWrapper}>
            <Entypo name="home" size={30} color="black" />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
      <Text style={{ textAlign: 'center', fontSize: 32, fontWeight: 'bold', }} >{title}</Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    position: 'fixed', // ✅ Keeps header fixed when scrolling
    top: 0,
    left: 0,
    right: 0, // ✅ Ensures background consistency
    zIndex: 10, // ✅ Keeps it above other content
  },
  logo: {
    width: 70, // ✅ Set width
    height: 70, // ✅ Set height
    resizeMode: 'contain', // ✅ Ensures image fits properly
  },
  iconWrapper: {
    padding: 5,
  },
  iconPlaceholder: {
    width: 30, // ✅ Keeps spacing consistent when icons are missing
  },
});
