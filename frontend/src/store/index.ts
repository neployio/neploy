import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "frontend/src/services/api/api";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});
