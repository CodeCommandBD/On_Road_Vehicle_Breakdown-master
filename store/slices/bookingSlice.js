import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentBooking: null,
  bookings: [],
  isLoading: false,
  error: null,
  filters: {
    status: "all",
    dateRange: null,
  },
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setBookingLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    setBookings: (state, action) => {
      state.bookings = action.payload;
      state.isLoading = false;
    },
    addBooking: (state, action) => {
      state.bookings.unshift(action.payload);
    },
    updateBookingStatus: (state, action) => {
      const { bookingId, status } = action.payload;
      const booking = state.bookings.find((b) => b._id === bookingId);
      if (booking) {
        booking.status = status;
      }
      if (state.currentBooking?._id === bookingId) {
        state.currentBooking.status = status;
      }
    },
    setBookingFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setBookingError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
  },
});

export const {
  setBookingLoading,
  setCurrentBooking,
  setBookings,
  addBooking,
  updateBookingStatus,
  setBookingFilters,
  setBookingError,
  clearCurrentBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;

// Selectors
export const selectCurrentBooking = (state) => state.booking.currentBooking;
export const selectBookings = (state) => state.booking.bookings;
export const selectBookingLoading = (state) => state.booking.isLoading;
export const selectBookingFilters = (state) => state.booking.filters;
