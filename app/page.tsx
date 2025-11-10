"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  const token = (typeof window !== "undefined" ? localStorage.getItem("authToken") : null)

  useEffect(() => {
    if (token) {
      router.push("/appointments")
    } else {
      router.push("/login")
    }
  }, [token, router])

  return null
}
