import { baseApi } from "frontend/src/services/api/api";
import { GatewayConfigRequest } from "frontend/src/types";

export const gateways = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    saveGatewayConfig: builder.mutation({
      query: ({ defaultVersioning, defaultVersion, loadBalancer }: GatewayConfigRequest) => ({
        url: "gateways/config",
        method: "POST",
        body: { defaultVersioning, defaultVersion, loadBalancer },
      }),
      invalidatesTags: ["gateways"],
    }),
  }),
});

export const { useSaveGatewayConfigMutation } = gateways;
