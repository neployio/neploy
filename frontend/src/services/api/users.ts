import { baseApi } from "./api";

export const users = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: "users/profile/update",
        method: "PUT",
        body: profileData,
      }),
    }),
    updatePassword: builder.mutation({
      query: (passwordData) => ({
        url: "users/profile/update-password",
        method: "PUT",
        body: passwordData,
      }),
    }),
    updateUserTechStacks: builder.mutation<void, { userId: string; techIds: string[] }>({
      query: ({ userId, techIds }) => ({
        url: "/users/update-techstacks",
        method: "PUT",
        body: { userId, techIds },
      }),
    }),
    getUsers: builder.query({
      query: () => ({
        url: "users",
        method: "GET",
      }),
    }),
    inviteUser: builder.mutation<void, { email: string; role: string }>({
      query: (inviteData) => ({
        url: "/users/invite",
        method: "POST",
        body: inviteData,
      }),
    }),
  }),
});

export const { useUpdateUserTechStacksMutation, useUpdateProfileMutation, useUpdatePasswordMutation, useGetUsersQuery, useInviteUserMutation } = users;
