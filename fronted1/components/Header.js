"use client";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { setUser } from "@/redux/authSlice";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Sparkles, BarChart3, Upload, LogOut } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const logoutHandler = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/user/logout`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setUser(null));
        toast.success(data.message || "Logged out successfully");
        router.push("/login");
      }
    } catch (error) {
      dispatch(setUser(null));
      toast.info("Logged out locally");
      router.push("/login");
    }
  };

  // Auth-aware route helpers: if logged out, route through login with redirect
  const uploadHref = user ? "/upload" : "/login?redirect=/upload";
  const visualizeHref = user ? "/tabSection" : "/login?redirect=/tabSection";
  const aiHref = user ? "/ai" : "/login?redirect=/ai";

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-3 px-4 md:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18"></path>
              <path d="M18 17V9"></path>
              <path d="M13 17V5"></path>
              <path d="M8 17v-3"></path>
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Excel Analytics
          </span>
        </Link>

        {/* Navigation Links */}
        <nav>
          <ul className="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-gray-700">
            <Link
              href={uploadHref}
              className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>Upload</span>
            </Link>

            <Link
              href={visualizeHref}
              className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Visualizations</span>
            </Link>

            <Link
              href={aiHref}
              className="flex items-center gap-1.5 hover:text-purple-600 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>AI Insights</span>
            </Link>

            {!user ? (
              <div className="flex items-center gap-2 pl-2">
                <Link href="/login">
                  <button className="px-4 py-2 rounded-xl text-gray-700 hover:text-blue-600 font-semibold transition text-sm cursor-pointer">
                    Login
                  </button>
                </Link>

                <Link href="/signup">
                  <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition text-sm cursor-pointer">
                    Sign Up
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <Link href="/profile" className="flex items-center gap-2 group">
                  {user.photo ? (
                    <img
                      src={user.photo}
                      alt={user.name || "User"}
                      className="w-8 h-8 rounded-full object-cover border-2 border-indigo-200 group-hover:border-indigo-500 transition"
                    />
                  ) : (
                    <FaUserCircle size={32} className="text-blue-600" />
                  )}
                  <span className="hidden md:inline-block text-xs font-semibold text-gray-800 max-w-[100px] truncate">
                    {user.name || "Profile"}
                  </span>
                </Link>

                <button
                  onClick={logoutHandler}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
