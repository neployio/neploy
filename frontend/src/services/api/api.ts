import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create our base query with proper CSRF handling for Laravel
const baseQuery = fetchBaseQuery({
  baseUrl: "/", // Update this to match your Laravel API prefix
  credentials: "include", // Important for cookies/session handling
  prepareHeaders: (headers) => {
    // Add CSRF token from meta tag if it exists
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
    if (token) {
      headers.set("X-CSRF-TOKEN", token);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "base-api",
  baseQuery,
  tagTypes: ["applications", "metadata", "onboard", "roles", "tech-stacks", "gateways"],
  endpoints: () => ({}),
});
