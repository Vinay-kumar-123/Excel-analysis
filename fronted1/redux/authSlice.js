import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",
    initialState : {
        user: null,
        token: null,
        isLoading: false,
    },
    reducers:{
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setToken: (state, action) => {
            state.token = action.payload;
        },
        logoutUser: (state) => {
            state.user = null;
        },
        updateUser: (state, action) => {
            state.user = action.payload;
        },
        setLoading : (state, action) =>{
            state.isLoading = action.payload;
        }
    },
});

export const {setUser, setToken, logoutUser,updateUser, setLoading} = authSlice.actions;
export default authSlice.reducer;