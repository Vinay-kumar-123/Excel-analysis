"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

export default function Signup() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/user/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Registration successful! Please log in.");
        router.push("/login");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Network error. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen px-4 pt-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Create an Account
        </h2>
        <p className="text-gray-500 mb-6 text-center text-sm">
          Get started with Excel Analytics today
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={user.name}
              onChange={handleChange}
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={user.email}
              onChange={handleChange}
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={user.password}
              onChange={handleChange}
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
