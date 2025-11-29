import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState: any = {
  items: [],
  isLoading: false,
  error: null,
};

const questionnairesSlice = createSlice({
  name: "questionnaires",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setQuestionnaires: (state, action: PayloadAction<{ items: any }>) => {
      state.items = action.payload.items;
      state.error = null;
      state.isLoading = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setLoading, setQuestionnaires, setError } =
  questionnairesSlice.actions;
export default questionnairesSlice.reducer;
