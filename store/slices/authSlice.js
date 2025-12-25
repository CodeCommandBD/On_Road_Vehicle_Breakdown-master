import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: null, // 'user', 'garage', 'admin'
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.user.role;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    toggleFavoriteSuccess: (state, action) => {
      const garage = action.payload; // Can be ID string or full object
      const garageId = garage._id || garage;

      if (!state.user.favoriteGarages) {
        state.user.favoriteGarages = [];
      }

      const index = state.user.favoriteGarages.findIndex(
        (f) => (f._id || f) === garageId
      );

      if (index === -1) {
        state.user.favoriteGarages.push(garage);
      } else {
        state.user.favoriteGarages.splice(index, 1);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  toggleFavoriteSuccess,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectFavorites = (state) =>
  state.auth.user?.favoriteGarages || [];
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserRole = (state) => state.auth.role;
