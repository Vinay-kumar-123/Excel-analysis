"use client";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import { setUser } from "@/redux/authSlice";
import { toast } from "react-toastify";
import Heroes from "../components/Heroes";

export default function Header() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const logoutHandler = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/user/logout`, user ,{
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.data.success) {
        dispatch(setUser(null));
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "logout failed");
    }
  };
  return (
    <>
      <header className="bg-gray-100 fixed top-0 w-full z-50 py-1">
        <div className="max-w-7xl mx-auto flex justify-between items-center mt-1 px-4">
          <Link href="/" className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-blue-600"
            >
              <path d="M3 3v18h18"></path>
              <path d="M18 17V9"></path>
              <path d="M13 17V5"></path>
              <path d="M8 17v-3"></path>
            </svg>
            <h1 className="text-2xl font-semibold leading-tight">
              Excel Analytics
            </h1>
          </Link>

          <nav>
            <ul className="flex gap-7 items-center text-lg font-semibold">
              {!user ? (
                <div className="flex gap-3">
                  <Link href="/login">
                    <bu
                      className="
      px-5 py-2 rounded-md
      bg-blue-600 text-white font-semibold
      shadow-md
      hover:bg-blue-700 hover:shadow-lg hover:scale-110
      transition
      duration-300
      ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50  cursor-pointer
    "
                    >
                      Login
                    </bu>
                  </Link>

                  <Link href="/signup">
                    <button
                      className="
      px-5 py-2 rounded-md
      border-2 border-gray-500 text-gray-700 font-semibold
      hover:border-gray-700 hover:text-gray-900 hover:scale-110
      shadow-sm
      transition
      duration-300
      ease-in-out
      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50  cursor-pointer
    "
                    >
                      Signup
                    </button>
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    href="/upload"
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="stroke-current"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload</span>
                  </Link>

                  <Link href="/profile">
                    <FaUserCircle size={40} className="text-blue-600" />
                  </Link>

                  <button
                    onClick={logoutHandler}
                    className="btn-primary px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 transition"
                  >
                    Logout
                  </button>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <Heroes />
    </>
  );
}
