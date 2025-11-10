import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: string
  email: string
  name: string
  role: "Admin" | "Operator"
}

interface AuthState {
  token: string | null
  user: User | null
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  token: null,
  user: null,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setAuth: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.error = null
      state.isLoading = false
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.error = null
    },
  },
})

export const { setLoading, setAuth, setError, logout } = authSlice.actions
export default authSlice.reducer
