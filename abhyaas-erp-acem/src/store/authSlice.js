import { createSlice } from '@reduxjs/toolkit';

// 1. Grab data from local storage before Redux even starts
const storedToken = localStorage.getItem('token') || null;
const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const initialState = {
    // 2. Use the stored data to set the initial state
    user: storedUser,
    token: storedToken,
    // If a token exists, they are authenticated right away!
    isAuthenticated: !!storedToken,
    school_id: storedUser?.school_id || null,

    isLoading: false,
    error: null,
};



const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token, school_id } = action.payload;
            state.user = user;
            state.token = token;
            // Depending on when the school_id is known: 
            // It could be set at login for users, or selected dynamically from a subdomain
            state.school_id = school_id || user?.school_id || null;
            state.isAuthenticated = true;
            state.error = null;
        },
        setSchoolId: (state, action) => {
            // Useful for public pages landing on a specific school domain
            // e.g. when fetching /api/school/details by tenant subdomain
            state.school_id = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.school_id = null;
            state.error = null;
        },
        authStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        authFailure: (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        }
    }
});

export const { setCredentials, setSchoolId, logout, authStart, authFailure } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentSchoolId = (state) => state.auth.school_id;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
