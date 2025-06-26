"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        passwordConfirm,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed.");
    } else {
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1500);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen flex items-center justify-end w-1/2 z-10">
      <div className="bg-[#18181b] p-8 rounded-lg shadow-lg w-full max-w-md mr-[18rem]">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Sign Up
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="w-full px-4 py-2 rounded bg-[#232326] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full px-4 py-2 rounded bg-[#232326] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded bg-[#232326] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1" htmlFor="passwordConfirm">
              Confirm Password
            </label>
            <input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded bg-[#232326] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {success && <div className="text-green-400 text-sm">{success}</div>}
          <button
            type="submit"
            className="w-full bg-[#3ea9ae] text-black font-semibold py-2 rounded hover:opacity-80 transition"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-gray-400">Already a member? </span>
          <Link href="/login" className="text-[#3ea9ae] hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}