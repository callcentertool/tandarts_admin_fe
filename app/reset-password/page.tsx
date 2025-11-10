"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { resetPassword } from "@/services/users.service";
import { ArrowLeft } from "lucide-react";

// Yup validation schema
const resetPasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required("Current password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),

  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),

  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),
});

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    setIsLoading(true);

    try {
      await resetPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      // Redirect to appointments page after successful reset
      router.push("/appointments");
    } catch (err) {
      const error = err as any;
      const errorMessage =
        error?.response?.data?.message || "Failed to reset password";

      // Set form-level error
      setFormError("root", {
        type: "manual",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="m-4 sm:m-6 max-w-2xl mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl sm:text-3xl font-semibold">
                Reset Password
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Root error message */}
              {errors.root && (
                <div className="p-3 text-sm text-destructive bg-destructive/15 border border-destructive/20 rounded-md">
                  {errors.root.message}
                </div>
              )}

              {/* Current Password Field */}
              <div className="space-y-2">
                <Input
                  label="Current Password*"
                  type="password"
                  {...register("currentPassword")}
                  error={!!errors.currentPassword}
                  errorMessage={errors.currentPassword?.message}
                  placeholder="Enter your current password"
                  className="text-sm"
                />
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Input
                  label="New Password*"
                  type="password"
                  {...register("newPassword")}
                  error={!!errors.newPassword}
                  errorMessage={errors.newPassword?.message}
                  placeholder="Enter your new password"
                  className="text-sm"
                />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Input
                  label="Confirm New Password*"
                  type="password"
                  {...register("confirmPassword")}
                  error={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword?.message}
                  placeholder="Confirm your new password"
                  className="text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? "Processing..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
