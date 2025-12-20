import { CreateRoleRequest, UpdateRoleRequest } from "frontend/src/types";
import { baseApi } from "./api";

export const roles = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<any, void>({
      query: () => "/roles",
      providesTags: ["roles"],
    }),
    createRole: builder.mutation<any, CreateRoleRequest>({
      query: ({ name, description, icon, color }) => ({
        url: "/roles",
        method: "POST",
        body: { name, description, icon, color },
      }),
      invalidatesTags: ["roles"],
    }),
    updateRole: builder.mutation<any, UpdateRoleRequest>({
      query: ({ id, name, description, icon, color }) => ({
        url: `/roles/${id}`,
        method: "PATCH",
        body: { name, description, icon, color },
      }),
      invalidatesTags: ["roles"],
    }),
    deleteRole: builder.mutation<any, { id: string }>({
      query: ({ id }) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["roles"],
    }),
    addUsersToRole: builder.mutation<any, { roleId: string; userIds: string[] }>({
      query: ({ roleId, userIds }) => ({
        url: `/roles/${roleId}/users`,
        method: "POST",
        body: { userIds },
      }),
      invalidatesTags: ["roles"],
    }),
    deleteUsersFromRole: builder.mutation<any, { roleId: string; userIds: string[] }>({
      query: ({ roleId, userIds }) => ({
        url: `/roles/${roleId}/users`,
        method: "DELETE",
        body: { userIds },
      }),
      invalidatesTags: ["roles"],
    }),
  }),
});

export const { useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation, useAddUsersToRoleMutation, useDeleteUsersFromRoleMutation } = roles;
