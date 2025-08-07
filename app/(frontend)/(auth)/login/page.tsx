"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log("Attempting sign in with:", { email }); // Debug log
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    console.log("Sign in response:", res); // Debug log
    
    setLoading(false);
    if (res?.error) {
      console.error("Sign in error:", res.error); // Debug log
      setError("Invalid email or password.");
    } else if (res?.ok) {
      console.log("Sign in successful! Redirecting..."); // Debug log
      // Manual redirect after successful login
      router.push("/");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
    setLoading(false);
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    await signIn("github", { callbackUrl: "/" });
    setLoading(false);
  };

  return (
    <div className="fixed right-0 top-0 h-screen flex items-center justify-end w-1/2 z-10">
      <div className="bg-[#18181b] p-8 rounded-lg shadow-lg w-full max-w-md mr-[18rem]">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Log In
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
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
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="current-password"
              className="w-full px-4 py-2 rounded bg-[#232326] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-[#3ea9ae] text-black font-semibold py-2 rounded hover:opacity-80 transition"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-700" />
          <span className="mx-3 text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-700" />
        </div>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-black font-semibold py-2 rounded hover:bg-gray-200 transition flex items-center justify-center gap-2"
          disabled={loading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            className="inline-block"
          >
            <g>
              <path
                fill="#4285F4"
                d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"
              />
              <path
                fill="#34A853"
                d="M6.3 14.7l7 5.1C15.5 17.1 19.4 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.6 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z"
              />
              <path
                fill="#FBBC05"
                d="M24 44c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.4C29.8 36 24 36 24 36c-5.8 0-10.7-1.9-14.3-5.2l6.6-5.4C18.2 32.9 21.1 34 24 34z"
              />
              <path
                fill="#EA4335"
                d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"
              />
            </g>
          </svg>
          Sign in with Google
        </button>
        <button
          onClick={handleGithubSignIn}
          className="w-full bg-[#050912] text-white font-semibold py-2 rounded hover:bg-gray-800 transition flex items-center justify-center gap-2 mt-3"
          disabled={loading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className="inline-block"
            fill="currentColor"
          >
            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          Sign in with GitHub
        </button>
        <div className="mt-6 text-center">
          <span className="text-gray-400">Not a member? </span>
          <Link
            href="/signup"
            className="text-[#3ea9ae] hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}