import apiClient from "@/lib/api-client";
import type { User } from "@/store/slices/usersSlice";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

interface CreateUserParams {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  role: "Admin" | "Operator";
}

interface UpdateUserParams extends Partial<CreateUserParams> {
  id: string;
}

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface GetUsersResponse {
  results: User[];
  totalResults: number;
  page: number;
}

export const login = async (body: any) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      body
    );
    // Don't show success toast for login as user will be redirected
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Login failed. Please try again.";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

export const getUsers = async (params: GetUsersParams = {}) => {
  try {
    const response = await apiClient.get<GetUsersResponse>("/users/list", {
      params: {
        page: params.page || 1,
        limit: params.limit || 5,
        search: params.search || "",
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to fetch users";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

export const createUser = async (data: CreateUserParams) => {
  try {
    const response = await apiClient.post<User>("/users/create", data);
    toast({
      title: "Success",
      description: "User created successfully",
      variant: "default",
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to create user";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

//  Update with POST
export const updateUser = async ({ id, ...data }: UpdateUserParams) => {
  try {
    const response = await apiClient.post<User>(`/users/update/${id}`, data);
    toast({
      title: "Success",
      description: "User updated successfully",
      variant: "default",
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to update user";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

export const deleteUser = async (id: string) => {
  try {
    await apiClient.delete(`/users/delete/${id}`);
    toast({
      title: "Success",
      description: "User deleted successfully",
      variant: "default",
    });
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to delete user";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

export const toggleUserStatus = async (id: string, isActive: boolean) => {
  try {
    const response = await apiClient.patch<User>(`/users/${id}/status`, {
      isActive,
    });
    toast({
      title: "Success",
      description: `User ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      variant: "default",
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to update user status";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

interface ResetPasswordParams {
  currentPassword: string;
  newPassword: string;
}

export const resetPassword = async (data: ResetPasswordParams) => {
  try {
    const response = await apiClient.post("/auth/reset-password", data);
    toast({
      title: "Success",
      description: "Password reset successfully",
      variant: "default",
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to reset password";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};
