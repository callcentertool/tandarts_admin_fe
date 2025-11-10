"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import {
  setUsers,
  setPage,
  addUser,
  updateUser,
  deleteUser,
  setLoading,
} from "@/store/slices/usersSlice";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Edit2,
  Trash2,
  ToggleRight,
  ToggleLeft,
  SearchIcon,
} from "lucide-react";
import DataTable, { DataTableColumn } from "@/components/table/DataTable";
import { UserModal } from "@/components/modals/user-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User } from "@/store/slices/usersSlice";
import {
  createUser,
  getUsers,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
  toggleUserStatus,
} from "@/services/users.service";

export default function UsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: users,
    total,
    page,
    limit,
    isLoading,
  } = useSelector((state: RootState) => state.users);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const prevSearchRef = useRef<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    userId?: string;
  }>({ open: false });
  const [toggleConfirm, setToggleConfirm] = useState<{
    open: boolean;
    userId?: string;
    currentStatus?: boolean;
  }>({
    open: false,
  });

  // Debounce search query and reset page to 1 when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset page to 1 when search value changes
      if (
        prevSearchRef.current !== searchQuery &&
        prevSearchRef.current !== ""
      ) {
        dispatch(setPage(1));
      }
      prevSearchRef.current = searchQuery;
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery, dispatch]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const data = await getUsers({
        page,
        limit,
        search: debouncedSearch,
      });
      dispatch(
        setUsers({
          items: data.results,
          total: data.totalResults,
          page: data.page,
          limit,
        })
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [dispatch, page, limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (
    userData: Omit<User, "id" | "isActive"> & { isActive?: boolean }
  ) => {
    try {
      const response = await createUser(userData);
      dispatch(addUser(response));
      setIsModalOpen(false);
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleEditUser = async (
    userData: Omit<User, "id" | "isActive"> & { isActive?: boolean }
  ) => {
    if (selectedUser) {
      try {
        const response = await updateUserService({
          id: selectedUser.id!,
          ...userData,
        });
        dispatch(updateUser(response));
        setSelectedUser(null);
        setIsModalOpen(false);
        // Refresh users list
        fetchUsers();
      } catch (error) {
        console.error("Error updating user:", error);
      }
    }
  };

  const handleDeleteConfirm = async (userId: string) => {
    try {
      await deleteUserService(userId);
      dispatch(deleteUser(userId));
      setDeleteConfirm({ open: false });
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleToggleConfirm = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await toggleUserStatus(userId, !currentStatus);
      dispatch(updateUser(response));
      setToggleConfirm({ open: false });
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <MainLayout>
      <div className="sm:space-y-6">
        <div>
          <CardHeader className="px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl font-semibold">
              Users Management
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Input
                  customPlaceholder={
                    <span className="flex justify-center items-center gap-2">
                      <SearchIcon className="w-4 h-4 text-black" /> Search here
                    </span>
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm shadow-lg bg-background"
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedUser(null);
                  setIsModalOpen(true);
                }}
                className="bg-primary hover:bg-primary w-full sm:w-auto text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 py-4">
            {(() => {
              const columns: DataTableColumn<User>[] = [
                { key: "name", header: "Name" },
                { key: "email", header: "Email" },
                { key: "phone", header: "Phone" },
                { key: "dateOfBirth", header: "DOB" },
                { key: "role", header: "Type" },
                {
                  key: "status",
                  header: "Status",
                  cell: (u) => (
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        (u as User).isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(u as User).isActive ? "Active" : "Inactive"}
                    </span>
                  ),
                },
              ];

              return (
                <DataTable<User>
                  columns={columns}
                  data={users || []}
                  getRowClassName={(u) =>
                    (u as User).isActive ? "bg-green-100" : "bg-red-100"
                  }
                  isLoading={isLoading}
                  renderActions={(user) => (
                    <div className="flex gap-[2px] sm:gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(user as User);
                          setIsModalOpen(true);
                        }}
                        className="p-[2px] sm:p-1"
                      >
                        <Edit2 className="w-4 h-4 sm:w-6 sm:h-6" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setToggleConfirm({
                            open: true,
                            userId: (user as User).id,
                            currentStatus: (user as User).isActive,
                          })
                        }
                        className="p-[2px] sm:p-1"
                      >
                        {(user as User).isActive ? (
                          <ToggleRight className="w-4 h-4 sm:w-6 sm:h-6" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDeleteConfirm({
                            open: true,
                            userId: (user as User).id,
                          })
                        }
                        className="p-[2px] sm:p-1"
                      >
                        <Trash2 className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
                      </Button>
                    </div>
                  )}
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  showingCount={users?.length || 0}
                  onPageChange={handlePageChange}
                />
              );
            })()}
          </CardContent>
        </div>
      </div>

      <UserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={selectedUser}
        onSubmit={selectedUser ? handleEditUser : handleAddUser}
      />

      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open })}
      >
        <AlertDialogContent className="w-11/12">
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this user? This action cannot be
            undone.
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel className="px-2 py-1 h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirm.userId &&
                handleDeleteConfirm(deleteConfirm.userId)
              }
              className="bg-red-500 hover:bg-red-600 px-2 py-1 h-9"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={toggleConfirm.open}
        onOpenChange={(open) => setToggleConfirm({ ...toggleConfirm, open })}
      >
        <AlertDialogContent className="w-11/12">
          <AlertDialogTitle>
            {toggleConfirm.currentStatus ? "Deactivate" : "Activate"} User
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to{" "}
            {toggleConfirm.currentStatus ? "deactivate" : "activate"} this user?
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel className="py-1 px-2 h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                toggleConfirm.userId &&
                handleToggleConfirm(
                  toggleConfirm.userId,
                  toggleConfirm.currentStatus ?? false
                )
              }
              className="bg-blue-500 hover:bg-blue-600 py-1 px-2 h-9"
            >
              Confirm
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
