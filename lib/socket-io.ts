import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"

/**
 * Initialize and connect socket
 */
export const initSocket = (authToken?: string) => {
  if (socket) return socket

  const token = authToken || (typeof window !== "undefined" ? localStorage.getItem("authToken") : null)

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
  })

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id)
  })

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected")
    socket = null
  })

  socket.on("error", (error) => {
    console.error("Socket error:", error)
  })

  return socket
}

/**
 * Get existing socket instance or initialize
 */
export const getSocket = () => {
  return socket || initSocket()
}

/**
 * Disconnect socket manually
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
