"use client";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  plan: "FREE" | "PRO";
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  users: User[];
}

export default function TenantDashboard() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role);

      if (payload.role === "ADMIN") fetchTenant(token);
      else setLoading(false);
    } catch {
      setRole(null);
      setLoading(false);
    }
  }, []);

  async function fetchTenant(token: string) {
    try {
      const res = await fetch("/api/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setTenant(data[0]);
      } else {
        setError(data.error || "Failed to load tenant");
      }
    } catch {
      setError("Failed to fetch tenant");
    } finally {
      setLoading(false);
    }
  }

  async function changeUserPlan(
    userId: string,
    action: "upgrade" | "downgrade"
  ) {
    if (!tenant) return;

    setLoadingUserId(userId);
    setError(null);

    try {
      const res = await fetch(
        `/api/tenants/${tenant.slug}/${action}/${userId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const data = await res.json();

      if (res.ok && tenant) {
        // update the user's plan in local state
        setTenant({
          ...tenant,
          users: tenant.users.map((u) =>
            u.id === userId ? { ...u, plan: data.plan } : u
          ),
        });
      } else {
        setError(data.error || "Action failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoadingUserId(null);
    }
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );

  if (role !== "ADMIN")
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-red-400">
        Access denied
      </div>
    );

  if (!tenant)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-red-400">
        Tenant not found
      </div>
    );

  const admins = tenant.users.filter((u) => u.role === "ADMIN");
  const freeMembers = tenant.users.filter(
    (u) => u.role === "MEMBER" && u.plan === "FREE"
  );
  const proMembers = tenant.users.filter(
    (u) => u.role === "MEMBER" && u.plan === "PRO"
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-400 text-center">
        {tenant.name} - Users
      </h1>

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-900 p-2 rounded text-center">
          {error}
        </p>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Admins */}
        <section>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Admins</h2>
          <div className="space-y-2">
            {admins.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-gray-800 p-3 rounded"
              >
                <span>{user.email}</span>
                <span
                  className={
                    user.plan === "PRO" ? "text-green-400" : "text-yellow-400"
                  }
                >
                  {user.plan}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Free Members */}
        <section>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Free Members
          </h2>
          <div className="space-y-2">
            {freeMembers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-gray-800 p-3 rounded"
              >
                <span>{user.email}</span>
                <button
                  disabled={loadingUserId === user.id}
                  onClick={() => changeUserPlan(user.id, "upgrade")}
                  className={`px-3 py-1 rounded font-semibold transition ${
                    loadingUserId === user.id
                      ? "bg-blue-300 text-gray-700 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-400 text-white"
                  }`}
                >
                  {loadingUserId === user.id ? "Upgrading..." : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Pro Members */}
        <section>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Pro Members
          </h2>
          <div className="space-y-2">
            {proMembers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-gray-800 p-3 rounded"
              >
                <span>{user.email}</span>
                <button
                  disabled={loadingUserId === user.id}
                  onClick={() => changeUserPlan(user.id, "downgrade")}
                  className={`px-3 py-1 rounded font-semibold transition ${
                    loadingUserId === user.id
                      ? "bg-red-300 text-gray-700 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-400 text-white"
                  }`}
                >
                  {loadingUserId === user.id ? "Downgrading..." : "Cancel PRO"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
