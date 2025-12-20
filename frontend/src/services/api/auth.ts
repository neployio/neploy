import { CompleteInviteRequest } from "frontend/src/types/request";
import { baseApi } from "./api";
import { User } from "frontend/src/types/common";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    completeInvite: builder.mutation<void, CompleteInviteRequest>({
      query: (data) => ({
        url: "users/complete-invite",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation<User, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: "login",
        method: "POST",
        body: { email, password },
      }),
      transformErrorResponse: (response: any) => {
        if (response.status === 303) {
          return { data: null, meta: { location: response.headers.get("location") } };
        }
        return response;
      },
    }),
    passwordLink: builder.mutation<void, { email: string; language: string }>({
      query: ({ email, language }) => ({
        url: "password/change",
        method: "POST",
        body: { email, language },
      }),
    }),
  }),
});

export const { useCompleteInviteMutation, useLoginMutation, usePasswordLinkMutation } = authApi;
