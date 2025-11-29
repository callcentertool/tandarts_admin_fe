import apiClient from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

export const getQuestions = async () => {
  try {
    const response = await apiClient.get<any>("/question/get-question");
    return response?.data || [];
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to fetch appointments";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};
