import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import Footer from "../components/Footer";
import { AuthProvider, useAuth } from "../hooks/useAuth"; // ✅ Import AuthProvider and useAuth

export default function RootLayout() {
  const publishableKey = Constants.expoConfig.extra.stripePublishableKey;

  if (!publishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>Stripe Key Missing</Text>
      </View>
    );
  }
  
  return (
    <AuthProvider> 
      <StripeProvider
        publishableKey={publishableKey}
        merchantIdentifier="merchant.com.bootupdesigner.jmaccleaningservices"
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Slot />
          <Footer />
        </GestureHandlerRootView>
      </StripeProvider>
    </AuthProvider>
  );
}
