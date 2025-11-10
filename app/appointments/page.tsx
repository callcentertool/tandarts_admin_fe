"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import {
  setAppointments,
  setLoading,
  setPage,
} from "@/store/slices/appointmentsSlice";
import { MainLayout } from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, SearchIcon, Loader2 } from "lucide-react";
import DataTable, { DataTableColumn } from "@/components/table/DataTable";
import {
  downloadAppointmentPDF,
  getAppointments,
} from "@/services/appointments.service";
import { format } from "date-fns";
import { initSocket } from "@/lib/socket-io";

export default function AppointmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, total, page, limit, isLoading } = useSelector(
    (state: RootState) => state.appointments
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const prevSearchRef = useRef<string>("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        prevSearchRef.current !== searchQuery &&
        prevSearchRef.current !== ""
      ) {
        dispatch(setPage(1));
      }
      prevSearchRef.current = searchQuery;
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, dispatch]);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const data = await getAppointments({
        page,
        limit,
        search: debouncedSearch,
      });
      dispatch(
        setAppointments({
          items: data.results,
          total: data.totalResults,
          page: data.page,
        })
      );
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, page, limit, debouncedSearch]);

    // ----- SOCKET.IO Integration -----
  useEffect(() => {
    const socket = initSocket();

    const handleReadData = () => {
      console.log("readData event received, fetching appointments...");
      fetchAppointments(); // Trigger fetch once
    };

    socket.on("readData", handleReadData);

    return () => {
      socket.off("readData", handleReadData);
    };
  }, [fetchAppointments]);
  // --------------------------------
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDownloadPDF = async (appointmentId: string) => {
    dispatch(setLoading(true));
    try {
      await downloadAppointmentPDF(appointmentId);
      dispatch(setLoading(false));
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDownloadAISummary = async (appointmentId: string) => {
    console.log("Downloading AI summary for appointment:", appointmentId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "high":
        return "bg-[#FFCEC9]";
      case "medium":
        return "bg-[#D4F4FF]";
      case "low":
        return "bg-[#E2FFE2]";
      default:
        return "bg-gray-100";
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!isLoading) {
      dispatch(setPage(newPage));
    }
  };

  const totalPages = Math.ceil(total / limit);

  const columns: DataTableColumn<(typeof items)[number]>[] = [
    { key: "bsnNumber", header: "BSN Number" },
    {
      key: "dateOfBirth",
      header: "Date of Birth",
      cell: (row) =>
        row.dateOfBirth
          ? format(new Date(row.dateOfBirth), "dd-MMM-yyyy")
          : "-",
    },
    { key: "phoneNumber", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "dentistName", header: "Patients Dentist Name" },
    { key: "addressDetails", header: "Address" },
  ];

  return (
    <MainLayout>
      <div className="sm:space-y-6">
        <div>
          <CardHeader className="px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl font-semibold">
              Appointments
            </CardTitle>

            <div className="relative w-full sm:w-64">
              <Input
                customPlaceholder={
                  <span className="flex justify-center items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-black" /> Search here
                    request
                  </span>
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm shadow-lg bg-background"
              />
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 py-4 space-y-4">
            <DataTable
              columns={columns}
              data={items || []}
              getRowClassName={(r) => getStatusColor((r as any).urgency)}
              renderActions={(appointment) => (
                <div className="flex gap-[2px] sm:gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadPDF((appointment as any)._id)}
                    title="Download PDF"
                    className="p-[2px] sm:p-1"
                    disabled={isLoading}
                  >
                    <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleDownloadAISummary((appointment as any).id)
                    }
                    disabled
                    title="Download AI Summary"
                    className="p-[2px] sm:p-1"
                  >
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 opacity-50" />
                  </Button>
                </div>
              )}
              page={page}
              totalPages={totalPages}
              total={total}
              showingCount={items?.length || 0}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </CardContent>
        </div>
      </div>
    </MainLayout>
  );
}
