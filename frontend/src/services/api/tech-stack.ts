import { TechStackWithApplications } from "frontend/src/types";
import { baseApi } from "./api";

export interface CreateTechStackRequest {
  name: string;
  description: string;
}

export interface UpdateTechStackRequest extends CreateTechStackRequest {
  id: string;
}

export const techStackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTechStacks: builder.query<TechStackWithApplications[], void>({
      query: () => ({
        url: "/tech-stacks",
        method: "GET",
      }),
      providesTags: ["tech-stacks"],
    }),
    createTechStack: builder.mutation<void, CreateTechStackRequest>({
      query: (body) => ({
        url: "/tech-stacks",
        method: "POST",
        body,
      }),
      invalidatesTags: ["tech-stacks"],
    }),
    updateTechStack: builder.mutation<void, UpdateTechStackRequest>({
      query: ({ id, ...body }) => ({
        url: `/tech-stacks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["tech-stacks"],
    }),
    deleteTechStack: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tech-stacks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["tech-stacks"],
    }),
  }),
});

export const { useGetTechStacksQuery, useCreateTechStackMutation, useUpdateTechStackMutation, useDeleteTechStackMutation } = techStackApi;
