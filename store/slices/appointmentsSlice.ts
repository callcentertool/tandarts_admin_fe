import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Appointment {
  id: string
  name: string
  bsn: string
  dateOfBirth: string
  phone: string
  email: string
  patientsDentistName: string
  status?: "completed" | "pending" | "cancelled"
}

interface AppointmentsState {
  items: Appointment[]
  total: number
  page: number
  limit: number
  isLoading: boolean
  error: string | null
}

const initialState: AppointmentsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 5,
  isLoading: false,
  error: null,
}

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setAppointments: (state, action: PayloadAction<{ items: Appointment[]; total: number; page: number }>) => {
      state.items = action.payload.items
      state.total = action.payload.total
      state.page = action.payload.page
      state.error = null
      state.isLoading = false
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.limit = action.payload
    },
  },
})

export const { setLoading, setAppointments, setError, setPage, setPageSize } = appointmentsSlice.actions
export default appointmentsSlice.reducer
