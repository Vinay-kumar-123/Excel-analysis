"use client";
import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser, setUser } from "@/redux/authSlice";
import { toast } from "react-toastify";
import userLogo from "./userphoto.png";
import api from "@/lib/api";
import { Camera, Mail, User as UserIcon } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";

const ProfileContent = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      const res = await api.put("/api/v1/user/update-photo", formData);

      const updatedUser = res.data.user;
      dispatch(setUser(updatedUser));
      toast.success("Profile photo updated successfully!");
    } catch (error) {
      if (error.response?.status === 401) {
        dispatch(logoutUser());
        toast.error("Your session has expired. Please log in again.");
        router.push("/login?redirect=/profile");
        return;
      }
      toast.error(error.response?.data?.message || "Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20">
      <div className="flex flex-col items-center p-8 max-w-md w-full bg-white shadow-xl rounded-2xl border border-gray-100">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }}
          accept="image/*"
        />

        <div className="relative group cursor-pointer" onClick={handleClick}>
          <img
            src={user?.photo || userLogo.src}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-md group-hover:opacity-90 transition"
          />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>

        {loading && <p className="text-xs text-indigo-600 font-semibold mt-3 animate-pulse">Uploading photo...</p>}
        <p className="text-[11px] text-gray-400 mt-2">Click image to change profile photo</p>

        <div className="w-full mt-6 space-y-4 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <UserIcon className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-[11px] text-gray-400">Full Name</p>
              <h2 className="text-sm font-bold text-gray-800">{user?.name || "Guest User"}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Mail className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-[11px] text-gray-400">Email Address</p>
              <p className="text-sm font-semibold text-gray-800">{user?.email || "Not logged in"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  return (
    <AuthGuard requiredMessage="Please log in to access your profile settings.">
      <ProfileContent />
    </AuthGuard>
  );
}
