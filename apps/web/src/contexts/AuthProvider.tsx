import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "../lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  refetchUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const res: any = await ApiClient.getMe();
        const userData = res?.user || res;
        if (!userData || !userData.email) return null;
        return {
          id: userData.id || userData.sub || userData._id,
          email: userData.email,
          full_name: userData.full_name || userData.fullName || "User",
          is_active: userData.isActive !== false,
          is_admin: Boolean(userData.isAdmin),
        } as User;
      } catch {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    try {
      await ApiClient.logout();
    } catch (e) {
      console.error(e);
    }
    queryClient.setQueryData(["user"], null);
    window.location.href = "/login";
  };

  const refetchUser = () => {
    refetch();
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
