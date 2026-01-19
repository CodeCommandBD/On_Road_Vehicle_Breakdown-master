"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { useDispatch, useSelector } from "react-redux";
import {
  loginSuccess,
  logout,
  selectIsAuthenticated,
  selectUser,
} from "@/store/slices/authSlice";
import { useEffect } from "react";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const isAuthenticatedRedux = useSelector(selectIsAuthenticated);
  const userRedux = useSelector(selectUser);

  // Query to fetch current user
  const {
    data: userData,
    status,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const response = await axiosInstance.get("/auth/me");
      return response.data;
    },
    // Only run if we think we are authenticated or on initial load
    enabled: true,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync Redux with Query data
  useEffect(() => {
    if (status === "success" && userData?.success) {
      // If server says we are logged in, update Redux
      dispatch(loginSuccess(userData.data || userData));
    } else if (status === "error") {
      // If server says we are NOT logged in (401 handled by interceptor or here)
      if (isAuthenticatedRedux) {
        dispatch(logout());
      }
    }
  }, [userData, status, dispatch, isAuthenticatedRedux]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await axiosInstance.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      queryClient.setQueryData(["authUser"], data);
    },
  });

  // Logout mutation (if you have a logout API)
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/auth/logout");
    },
    onSettled: () => {
      dispatch(logout());
      queryClient.setQueryData(["authUser"], null);
      queryClient.clear();
    },
  });

  return {
    user: userData?.data?.user || userData?.user || userRedux,
    isAuthenticated:
      (status === "success" && !!userData) || isAuthenticatedRedux,
    isLoading: isLoading && !isAuthenticatedRedux, // Only show loading if we don't have Redux state yet
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    refetchUser: refetch,
  };
};
