import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  User,
  FootprintSnapshot,
  CalculatorInput,
  CalculatorResult,
  Action,
  ActionCommitment,
  Insight,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
  tagTypes: ['User', 'Footprint', 'Actions', 'Insights'],
  endpoints: (builder) => ({
    // Users
    createUser: builder.mutation<User, { region: string; householdSize: number }>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: ['User'],
    }),
    updateUserProfile: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({ url: `/users/${id}/profile`, method: 'PUT', body: data }),
      invalidatesTags: ['User'],
    }),

    // Footprint
    saveFootprint: builder.mutation<
      { snapshot: FootprintSnapshot; personality: string },
      { userId: string; input: CalculatorInput }
    >({
      query: ({ userId, input }) => ({ url: `/footprint/${userId}`, method: 'POST', body: input }),
      invalidatesTags: ['Footprint', 'Insights', 'User'],
    }),
    getFootprints: builder.query<FootprintSnapshot[], string>({
      query: (userId) => `/footprint/${userId}`,
      providesTags: ['Footprint'],
    }),
    getLatestFootprint: builder.query<FootprintSnapshot, string>({
      query: (userId) => `/footprint/${userId}/latest`,
      providesTags: ['Footprint'],
    }),
    previewFootprint: builder.mutation<CalculatorResult, { userId: string; input: CalculatorInput }>({
      query: ({ userId, input }) => ({
        url: `/footprint/${userId}/preview`,
        method: 'POST',
        body: input,
      }),
    }),

    // Actions
    getActions: builder.query<Action[], void>({
      query: () => '/actions',
      providesTags: ['Actions'],
    }),
    commitAction: builder.mutation<
      { commitment: ActionCommitment; action: Action },
      { userId: string; actionId: string }
    >({
      query: ({ userId, actionId }) => ({
        url: `/actions/${userId}/commit`,
        method: 'POST',
        body: { actionId },
      }),
      invalidatesTags: ['Actions'],
    }),
    getActiveCommitments: builder.query<ActionCommitment[], string>({
      query: (userId) => `/actions/${userId}/active`,
      providesTags: ['Actions'],
    }),
    checkinAction: builder.mutation<ActionCommitment, { userId: string; actionId: string }>({
      query: ({ userId, actionId }) => ({
        url: `/actions/${userId}/${actionId}/checkin`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Actions'],
    }),
    removeCommitment: builder.mutation<void, { userId: string; actionId: string }>({
      query: ({ userId, actionId }) => ({
        url: `/actions/${userId}/${actionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Actions'],
    }),

    // Insights
    getInsights: builder.query<{ insights: Insight[]; tip: string }, string>({
      query: (userId) => `/insights/${userId}`,
      providesTags: ['Insights'],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useGetUserQuery,
  useUpdateUserProfileMutation,
  useSaveFootprintMutation,
  useGetFootprintsQuery,
  useGetLatestFootprintQuery,
  usePreviewFootprintMutation,
  useGetActionsQuery,
  useCommitActionMutation,
  useGetActiveCommitmentsQuery,
  useCheckinActionMutation,
  useRemoveCommitmentMutation,
  useGetInsightsQuery,
} = api;
