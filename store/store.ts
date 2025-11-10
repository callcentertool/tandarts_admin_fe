import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import appointmentsReducer from "./slices/appointmentsSlice"
import usersReducer from "./slices/usersSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentsReducer,
    users: usersReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
