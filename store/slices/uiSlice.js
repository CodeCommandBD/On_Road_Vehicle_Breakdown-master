import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarOpen: true,
  mobileMenuOpen: false,
  modalOpen: false,
  modalContent: null,
  theme: "light",
  notifications: [],
  searchTerm: "",
  unreadNotificationsCount: 0,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      state.modalContent = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = null;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setUnreadNotificationsCount: (state, action) => {
      state.unreadNotificationsCount = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  openModal,
  closeModal,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setSearchTerm,
  setUnreadNotificationsCount,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectModalOpen = (state) => state.ui.modalOpen;
export const selectModalContent = (state) => state.ui.modalContent;
export const selectTheme = (state) => state.ui.theme;
export const selectNotifications = (state) => state.ui.notifications;
export const selectSearchTerm = (state) => state.ui.searchTerm;
export const selectUnreadNotificationsCount = (state) =>
  state.ui.unreadNotificationsCount;
