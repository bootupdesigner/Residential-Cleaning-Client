import React from "react";
import { View } from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import Footer from "../components/Footer";
import { AuthProvider } from "../hooks/useAuth";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

function FooterWithSafeArea() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: insets.bottom, backgroundColor: "white" }}>
      <Footer />
    </View>
  );
}

export default function RootLayout() {
  const publishableKey = Constants.expoConfig.extra.stripePublishableKey;

  if (!publishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>Stripe Key Missing</Text>
      </View>
    );
  }
  const insets = useSafeAreaInsets();

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={publishableKey}
          merchantIdentifier="merchant.com.bootupdesigner.jmaccleaningservices"
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Slot />
            <FooterWithSafeArea />
          </GestureHandlerRootView>
        </StripeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
