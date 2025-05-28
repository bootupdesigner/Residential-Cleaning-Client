// app/_layout.web.js
"use client";

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Slot } from "expo-router";
import Footer from "../components/Footer";
import { AuthProvider } from "../hooks/useAuth";
import { SafeAreaProvider } from "react-native-safe-area-context";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function WebRootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Elements stripe={stripePromise}>
          <Slot />
          <Footer />
        </Elements>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
