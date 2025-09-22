import { Application } from "@/types/common";
import { baseApi } from "./api";

export const applications = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllApplications: builder.query<Application[], void>({
      query: () => ({
        url: "applications",
        method: "GET",
      }),
      providesTags: ["applications"],
    }),
    loadBranches: builder.query({
      query: ({ repoUrl }: { repoUrl: string }) => ({
        url: "applications/branches",
        method: "POST",
        body: { repoUrl },
      }),
    }),
    createApplication: builder.mutation({
      query: ({ appName, description }: { appName: string; description: string }) => ({
        url: "applications",
        method: "POST",
        body: { appName, description },
      }),
      invalidatesTags: ["applications"],
    }),
    deployApplication: builder.mutation({
      query: ({ appId, repoUrl, branch, endpointType, domain }: { 
        appId: string; 
        repoUrl: string; 
        branch: string; 
        endpointType?: string; 
        domain?: string; 
      }) => ({
        url: `applications/${appId}/deploy`,
        method: "POST",
        body: { repoUrl, branch, endpointType, domain },
      }),
      invalidatesTags: ["applications"],
    }),
    uploadApplication: builder.mutation({
      query: ({ appId, file }: { appId: string; file: File }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `applications/${appId}/upload`,
          method: "POST",
          body: formData,
          // Don't set Content-Type header, browser will set it with boundary
          formData: true,
        };
      },
      invalidatesTags: ["applications"],
    }),
    deleteApplication: builder.mutation({
      query: ({ appId }: { appId: string }) => ({
        url: `applications/${appId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["applications"],
    }),
    startApplication: builder.mutation({
      query: ({ appId, versionId }: { appId: string; versionId: string }) => ({
        url: `applications/${appId}/start/${versionId}`,
        method: "POST",
      }),
      invalidatesTags: ["applications"],
    }),
    stopApplication: builder.mutation({
      query: ({ appId, versionId }: { appId: string; versionId: string }) => ({
        url: `applications/${appId}/stop/${versionId}`,
        method: "POST",
      }),
      invalidatesTags: ["applications"],
    }),
    deleteVersion: builder.mutation({
      query: ({ appId, versionId }: { appId: string; versionId: string }) => ({
        url: `applications/${appId}/versions/${versionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["applications"],
    }),
    getVersionLogs: builder.query<{ logs: string[] }, { appId: string; versionId: string }>({
      query: ({ appId, versionId }) => ({
        url: `applications/${appId}/versions/${versionId}/logs`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetAllApplicationsQuery,
  useLoadBranchesQuery,
  useCreateApplicationMutation,
  useDeployApplicationMutation,
  useUploadApplicationMutation,
  useStartApplicationMutation,
  useStopApplicationMutation,
  useDeleteApplicationMutation,
  useDeleteVersionMutation,
  useGetVersionLogsQuery,
} = applications;
