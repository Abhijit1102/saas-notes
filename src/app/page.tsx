"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/notes";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">
          Login
        </h1>

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-900 p-2 rounded">
            {error}
          </p>
        )}

        <input
          className="border border-gray-600 bg-gray-700 text-white p-3 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border border-gray-600 bg-gray-700 text-white p-3 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className={`w-full py-3 rounded font-semibold transition ${
            loading
              ? "bg-blue-300 text-gray-700 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-400 text-white"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
