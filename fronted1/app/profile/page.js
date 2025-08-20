"use client";
import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/redux/authSlice";
import { toast } from "react-toastify";
import userLogo from "./userphoto.png";
import axios from "axios";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      const res = await axios.put(
        `${apiUrl}/api/v1/user/update-photo`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      const updatedUser = res.data.user;
      dispatch(setUser(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile photo updated!");
    } catch (error) {
      toast.error("Image upload failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center p-6 max-w-md mx-auto bg-white shadow-lg rounded-lg mt-10">
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        style={{ display: "none" }}
        accept="image/*"
      />

      <img
        src={user?.photo || userLogo.src} 
        alt="Profile"
        onClick={handleClick}
        className="w-28 h-28 rounded-full object-cover border-2 border-gray-300 cursor-pointer"
      />

      {loading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
      <h1 className="text-xl font-bold mt-4">Name: {user?.name || "Your Name"}</h1>
      <p className="text-gray-600">Email: {user?.email || "youremail@example.com"}</p>
    </div>
  );
};

export default Profile;
