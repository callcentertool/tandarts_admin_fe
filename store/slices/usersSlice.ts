import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface User {
  id?: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  role: "Admin" | "Operator"
  isActive?: boolean
}

interface UsersState {
  items: User[]
  total: number
  page: number
  limit: number
  isLoading: boolean
  error: string | null
}

const initialState: UsersState = {
  items: [],
  total: 0,
  page: 1,
  limit: 5,
  isLoading: false,
  error: null,
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setUsers: (
      state,
      action: PayloadAction<{
        items: User[]
        total: number
        page: number
        limit?: number
      }>
    ) => {
      state.items = action.payload.items
      state.total = action.payload.total
      state.page = action.payload.page
      if (action.payload.limit) {
        state.limit = action.payload.limit
      }
      state.error = null
      state.isLoading = false
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.items.push(action.payload)
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.items.findIndex((u) => u.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((u) => u.id !== action.payload)
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
  },
})

export const {
  setLoading,
  setUsers,
  setPage,
  addUser,
  updateUser,
  deleteUser,
  setError,
} = usersSlice.actions
export default usersSlice.reducer
