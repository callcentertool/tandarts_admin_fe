"use client";

import type React from "react";
import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { User } from "@/store/slices/usersSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Select } from "../ui/SelectInput";

// Yup validation schema
const userSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? undefined : value))
    .when("$isEdit", {
      is: true,
      then: (schema) =>
        schema
          .optional()
          .test(
            "password-validation",
            "Password must be at least 8 characters",
            function (value) {
              // In edit mode, empty/undefined password is allowed
              if (!value || (typeof value === "string" && value.trim() === ""))
                return true;
              // If password is provided, validate it
              return value.length >= 8;
            }
          )
          .test(
            "password-letter",
            "Password must contain at least one letter",
            function (value) {
              if (!value || (typeof value === "string" && value.trim() === ""))
                return true;
              return /[a-zA-Z]/.test(value);
            }
          )
          .test(
            "password-number",
            "Password must contain at least one number",
            function (value) {
              if (!value || (typeof value === "string" && value.trim() === ""))
                return true;
              return /\d/.test(value);
            }
          )
          .test(
            "password-special",
            "Password must contain at least one special character",
            function (value) {
              if (!value || (typeof value === "string" && value.trim() === ""))
                return true;
              return /[^a-zA-Z0-9]/.test(value);
            }
          ),
      otherwise: (schema) =>
        schema
          .required("Password is required")
          .min(8, "Password must be at least 8 characters")
          .matches(/[a-zA-Z]/, "Password must contain at least one letter")
          .matches(/\d/, "Password must contain at least one number")
          .matches(
            /[^a-zA-Z0-9]/,
            "Password must contain at least one special character"
          ),
    }),

  phone: yup
    .string()
    .nullable()
    .optional()
    .test("phone-format", "Please enter a valid phone number", (value) => {
      if (!value || value.trim() === "") return true; // Empty is allowed
      return /^[0-9+\-\s()]+$/.test(value);
    }),

  dateOfBirth: yup
    .string()
    .nullable()
    .optional()
    .test("is-adult", "User must be at least 18 years old", (value) => {
      if (!value || value.trim() === "") return true; // Empty is allowed
      const dateOfBirth = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      return age > 18 || (age === 18 && monthDiff >= 0);
    }),
  role: yup
    .string()
    .oneOf(["Admin", "Operator"])
    .required("User type is required"),
});

type UserFormData = {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  role: "Admin" | "Operator";
};

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (
    data: Omit<User, "id" | "isActive"> & { isActive?: boolean }
  ) => void;
}

export function UserModal({
  open,
  onOpenChange,
  user,
  onSubmit,
}: UserModalProps) {
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    trigger, // Add trigger for manual validation
  } = useForm({
    resolver: yupResolver(userSchema),
    context: { isEdit },
    mode: "onChange", // Add this for real-time validation
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      dateOfBirth: "",
      role: "Operator",
    },
  });

  // Watch form values
  const formValues = watch();

  // Reset form when user changes or modal opens/closes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: "", // Password is empty in edit mode - validation will allow it
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || "",
        role: user.role,
      });
    } else {
      reset({
        name: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
        role: "Operator",
      });
    }
  }, [user, open, reset]);

  const onFormSubmit: SubmitHandler<UserFormData> = (data) => {
    // For edit mode, if password is empty, remove it from submission
    const submitData =
      isEdit && !data.password ? { ...data, password: undefined } : data;

    onSubmit(
      submitData as Omit<User, "id" | "isActive"> & { isActive?: boolean }
    );
  };

  // Handle select change with validation
  const handleUserTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as "Admin" | "Operator";
    setValue("role", value, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit as any)}
          className="space-y-2"
        >
          {/* Name Field */}
          <div className="space-y-2">
            <Input
              label="Name*"
              {...register("name")}
              error={!!errors.name}
              errorMessage={errors.name?.message}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Input
              label="Email*"
              type="email"
              {...register("email")}
              error={!!errors.email}
              errorMessage={errors.email?.message}
              disabled={isEdit}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Input
              label={
                isEdit
                  ? "Password (leave blank to keep unchanged)"
                  : "Password*"
              }
              type="password"
              {...register("password")}
              error={!!errors.password}
              errorMessage={errors.password?.message}
              placeholder={
                isEdit ? "Leave blank to keep unchanged" : "Enter password"
              }
              required={!isEdit}
              disabled={isEdit}
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Input
              label="Phone"
              {...register("phone")}
              error={!!errors.phone}
              errorMessage={errors.phone?.message}
            />
          </div>

          {/* Date of Birth Field */}
          <div className="grid grid-cols-2 gap-x-2">
            <Input
              label="Date of Birth"
              type="date"
              {...register("dateOfBirth")}
              error={!!errors.dateOfBirth}
              errorMessage={errors.dateOfBirth?.message}
            />
            {/* User Type Field - FIXED */}
            <Select
              label="User Type*"
              value={formValues.role}
              onChange={handleUserTypeChange}
              error={!!errors.role}
              errorMessage={errors.role?.message}
              options={[
                { value: "Operator", label: "Operator" },
                { value: "Admin", label: "Admin" },
              ]}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              size={"sm"}
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size={"sm"}
              type="submit"
              className="bg-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : isEdit ? "Update" : "Create"}{" "}
              User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
