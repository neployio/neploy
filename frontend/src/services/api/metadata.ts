import { MetadataRequest } from "frontend/src/types/request";
import { baseApi } from "./api";

export const metadata = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateMetadata: builder.mutation({
      query: ({ data }: { data: MetadataRequest }) => ({
        url: "metadata",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["metadata"],
    }),
  }),
});

export const { useUpdateMetadataMutation } = metadata;
