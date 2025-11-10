import apiClient from "@/lib/api-client";
import type { Appointment } from "@/store/slices/appointmentsSlice";
import { toast } from "@/hooks/use-toast";

interface GetAppointmentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface GetAppointmentsResponse {
  results: Appointment[];
  totalResults: number;
  page: number;
}

export const getAppointments = async (params: GetAppointmentsParams = {}) => {
  try {
    const response = await apiClient.get<GetAppointmentsResponse>(
      "/question/results",
      {
        params: {
          page: params.page || 1,
          limit: params.limit || 5,
          search: params.search || "",
        },
      }
    );
    return response.data;
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

export const downloadAppointmentPDF = async (appointmentId: string) => {
  try {
    const response = await apiClient.get(
      `/question/pdf-report/${appointmentId}`,
      {
        responseType: "arraybuffer", 
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
      }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    toast({
      title: "Success",
      description: "PDF downloaded successfully",
      variant: "default",
    });
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to download PDF";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};

export const downloadAISummary = async (appointmentId: string) => {
  try {
    const response = await apiClient.get<{ summary: string }>(
      `/appointments/${appointmentId}/ai-summary`
    );
    toast({
      title: "Success",
      description: "AI summary downloaded successfully",
      variant: "default",
    });
    return response.data.summary;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "Failed to download AI summary";
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    throw error;
  }
};
