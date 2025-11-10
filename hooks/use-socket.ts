"use client"

import { useEffect, useRef } from "react"
import { initSocket, disconnectSocket, getSocket } from "@/lib/socket-io"

export function useSocket() {
  const socketRef = useRef(getSocket())

  useEffect(() => {
    // Initialize socket on mount
    socketRef.current = initSocket()

    return () => {
      // Disconnect socket on unmount
      disconnectSocket()
    }
  }, [])

  const socket = socketRef.current

  return { socket }
}
