import { OnboardRequest } from "frontend/src/types/request";
import { baseApi } from "./api";

export const onboard = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    onboard: builder.mutation({
      query: ({ data }: { data: OnboardRequest }) => ({
        url: "onboard",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useOnboardMutation } = onboard;
