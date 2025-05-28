// app/booking.web.js
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { CardElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/authUtils";
import { useAuth } from "../hooks/useAuth";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const addOnsList = [
  { id: "windows", name: "Window Cleaning", price: 10 },
  { id: "stove", name: "Stove/Oven Cleaning", price: 15 },
  { id: "ceiling_fan", name: "Ceiling Fan Cleaning", price: 5 },
];

function BookingForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [allAvailability, setAllAvailability] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [ceilingFanCount, setCeilingFanCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${API_BASE_URL}/api/users/profile`, { headers });
        if (!res.data) router.push("/signin");
      } catch {
        router.push("/signin");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const res = await axios.get(`${API_BASE_URL}/api/admin/get-availability`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const availability = res.data.availability || {};
        setAllAvailability(availability);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validDates = Object.keys(availability).filter((date) => {
          const dateObj = new Date(date + "T00:00:00");
          return availability[date].length > 0 && dateObj >= today;
        });
        setAvailableDates(validDates);
      } catch {}
    };
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const fetchTimes = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const res = await axios.get(`${API_BASE_URL}/api/admin/get-availability`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedAvailability = res.data.availability;
        setAllAvailability(updatedAvailability);
        setAvailableTimes(updatedAvailability[selectedDate]?.map((t) => ({ label: t, value: t })) || []);
      } catch {}
    };
    fetchTimes();
  }, [selectedDate]);

  const toggleAddOn = (addOn) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOn.id) ? prev.filter((id) => id !== addOn.id) : [...prev, addOn.id]
    );
  };

  const calculateTotal = () => {
    const base = user?.cleaningPrice || 0;
    const addOns = addOnsList.filter((a) => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
    return base + addOns + ceilingFanCount * 5;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const token = await SecureStore.getItemAsync("authToken");
    if (!token || !user) return alert("Not authenticated");

    try {
      const total = calculateTotal();
      const payment = await axios.post(
        `${API_BASE_URL}/api/payment/pay`,
        { userId: user.id, selectedAddOns, ceilingFanCount, totalPrice: total },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = await stripe.confirmCardPayment(payment.data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) return alert(result.error.message);

      const booking = await axios.post(
        `${API_BASE_URL}/api/bookings/book`,
        { selectedDate, selectedTime, userId: user.id, addOns: selectedAddOns },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      router.push(`/booking-confirmed?selectedDate=${selectedDate}&selectedTime=${selectedTime}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Booking failed");
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <Header title="Schedule a Cleaning" home={true} />
      <form onSubmit={handleSubmit}>
        <h2>Book Your Cleaning</h2>

        <label>Select a Date:</label>
        <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required>
          <option value="">-- Choose a Date --</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>{new Date(date + "T00:00:00").toDateString()}</option>
          ))}
        </select>

        <label>Select a Time:</label>
        <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} required>
          <option value="">-- Choose a Time --</option>
          {availableTimes.map((time) => (
            <option key={time.value} value={time.value}>{time.label}</option>
          ))}
        </select>

        <h3>Add-on Services</h3>
        {addOnsList.map((addOn) => (
          <label key={addOn.id}>
            <input
              type="checkbox"
              checked={selectedAddOns.includes(addOn.id)}
              onChange={() => toggleAddOn(addOn)}
            />
            {addOn.name} (+${addOn.price})
          </label>
        ))}

        <label>Ceiling Fans:</label>
        <input
          type="number"
          min="0"
          value={ceilingFanCount}
          onChange={(e) => setCeilingFanCount(Math.max(0, parseInt(e.target.value) || 0))}
        />

        <p>Total Price: ${calculateTotal()}</p>

        <CardElement />
        <button type="submit" disabled={!selectedDate || !selectedTime}>Confirm Booking</button>
      </form>
      <Footer />
    </div>
  );
}

export default function BookingWeb() {
  return (
    <Elements stripe={stripePromise}>
      <BookingForm />
    </Elements>
  );
}
