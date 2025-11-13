"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuth, setError } from "@/store/slices/authSlice";
import type { AppDispatch } from "@/store/store";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import loginImage from "../../public/login_image.png";
import loginImageTop from "../../public/login_top.png";
import { login } from "@/services/users.service";

// Yup validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
login(data)
  .then((response) => {
    localStorage.setItem("authToken", response?.tokens?.access?.token);
    localStorage.setItem("user", JSON.stringify(response?.user));

    dispatch(setAuth({
      token: response?.tokens?.access?.token,
      user: response?.user,
    }));

    console.log("response", response);
    return response; //  important so next .then gets the response
  })
  .then(() => {
    router.push("/appointments"); //  will run after the above completes
  })
  .catch((err) => {
 const error = err as any;
      const errorMessage =
        error?.response?.data?.message || "Authentication failed";
      dispatch(setError(errorMessage));

      // Set form-level error
      setFormError("root", {
        type: "manual",
        message: errorMessage,
      });
  });

    } catch (err) {
      const error = err as any;
      const errorMessage =
        error?.response?.data?.message || "Authentication failed";
      dispatch(setError(errorMessage));

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
    <div className="min-h-screen  max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 place-items-center gap-x-10 px-4 sm:px-6 py-10">
      {/* LEFT SIDE - Visible on desktop only */}
      <div className="hidden md:block bg-primary w-full rounded-xl p-8 lg:p-10">
        <div className="w-full h-auto mx-auto">
          <h1 className="text-background text-4xl lg:text-5xl font-bold text-center mb-10 border-b-4 border-b-background w-fit mx-auto pb-4">
            Log In
          </h1>
        </div>

        <div className="relative w-full aspect-[16/9]">
          <Image
            src={loginImage}
            alt="login"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <Card className="w-full max-w-md border-none">
        <CardHeader className="text-center px-4 sm:px-6">
          {/* MOBILE IMAGE */}
          <div className="relative w-full h-24">
            <Image
              src={loginImageTop}
              alt="login"
              fill
              className="object-contain"
              priority
            />
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-semibold text-gray-800">
            Log In
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Root error message */}
            {errors.root && (
              <div className="p-3 text-sm text-destructive bg-destructive/15 border border-destructive/20 rounded-md">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-2">
              <Input
                placeholder="Email*"
                type="email"
                {...register("email")}
                error={!!errors.email}
                errorMessage={errors.email?.message}
                className="text-sm px-4 py-3"
              />
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Password*"
                type="password"
                {...register("password")}
                error={!!errors.password}
                errorMessage={errors.password?.message}
                className="text-sm px-4 py-3"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base py-4"
            >
              {isLoading ? "Processing..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
