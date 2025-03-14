import * as SecureStore from "expo-secure-store";

// ✅ Reusable function to get auth headers
export const getAuthHeaders = async () => {
  const token = await SecureStore.getItemAsync("authToken");
  if (!token) {
    console.error("❌ No auth token found!");
    return {};
  }
  return { Authorization: `Bearer ${token}` }; // ✅ Correct format
};
