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

export const fetchQuestionById = async (id: string) => {
  try {
    const response = await apiClient.post<any>(`/question/get-question-id`, {
      id,
    });
    return response?.data || null;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to fetch question";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

export const updateQuestion = async (id: string, data: any) => {
  try {
    const response = await apiClient.post<any>(`/question/update-question`, {
      _id: id,
      ...data,
    });
    toast({
      title: "Success",
      description: "Question updated successfully",
      variant: "default",
    });
    return response?.data || null;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to update question";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

export const createQuestion = async (data: any) => {
  try {
    const response = await apiClient.post<any>(
      "/question/create-question",
      data
    );
    toast({
      title: "Success",
      description: "Question created successfully",
      variant: "default",
    });
    return response?.data || null;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to create question";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};
