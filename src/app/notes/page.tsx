"use client";
import { useEffect, useState } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  author?: { id: string; email: string; role: "ADMIN" | "MEMBER"; plan?: "FREE" | "PRO" };
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<"FREE" | "PRO">("FREE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [userId, setUserId] = useState<string>("");

  const FREE_PLAN_LIMIT = 3;

  // Fetch notes + user info
  const fetchNotes = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("data :",data)
      if (res.ok) {
        setNotes(data.notes || []);
        setPlan(data.plan);
        if (data.me) {
          setUserId(data.me.id);
          setUserRole(data.me.role);
        }
      } else setError(data.error || "Failed to load notes");
    } catch {
      setError("Failed to fetch notes");
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Compute limits
  const noteLimit = userRole === "MEMBER" && plan === "FREE" ? FREE_PLAN_LIMIT : Infinity;
  const myNotesCount = notes.filter((n) => n.author?.id === userId).length;
  const reachedLimit = userRole === "MEMBER" && plan === "FREE" && myNotesCount >= noteLimit;

  // Visible notes
  const visibleNotes = userRole === "ADMIN" ? notes : notes.filter((n) => n.author?.id === userId);

  // Add / Update note
  const addOrUpdateNote = async () => {
    setError(null);
    if (!editingId && reachedLimit) {
      setError(`FREE plan allows only ${noteLimit} notes. Ask admin to upgrade.`);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const url = editingId ? `/api/notes/${editingId}` : "/api/notes";
    const method = editingId ? "PUT" : "POST";
    setLoading(true);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (res.ok) {
        if (editingId) {
          setNotes(notes.map((n) => (n.id === editingId ? data : n)));
          setEditingId(null);
        } else setNotes([...notes, data]);
        setTitle("");
        setContent("");
      } else setError(data.error || "Failed to save note");
    } catch {
      setError("Failed to save note");
    }
    setLoading(false);
  };

  // Delete note
  const deleteNote = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotes(notes.filter((n) => n.id !== id));
      else {
        const data = await res.json();
        setError(data.error || "Failed to delete note");
      }
    } catch {
      setError("Failed to delete note");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-400">Notes</h1>

        <p className="mb-4">
          Current Plan:{" "}
          <span className="font-semibold text-green-400">
            {userRole === "ADMIN" ? "PRO (ADMIN)" : plan}
          </span>{" "}
          {userRole === "MEMBER" ? (
            plan === "FREE" ? (
              <span className="ml-2 text-sm text-yellow-400">
                ({myNotesCount}/{noteLimit}) — Ask admin to upgrade
              </span>
            ) : (
              <span className="ml-2 text-sm text-blue-400">(Unlimited notes)</span>
            )
          ) : null}
        </p>

        {error && <p className="text-red-400 mb-4 bg-red-900 p-2 rounded">{error}</p>}

        <ul>
          {visibleNotes.map((n) => {
            const canEditOrDelete =
              userRole === "ADMIN" || (n.author?.id === userId && userRole === "MEMBER");
            return (
              <li
                key={n.id}
                className="border border-gray-700 p-4 mb-3 rounded bg-gray-700 hover:bg-gray-600 transition"
              >
                <h2 className="font-bold text-lg">{n.title}</h2>
                <p className="text-gray-300">{n.content}</p>
                {n.author && (
                  <small className="text-gray-400 block mt-1">
                    {n.author.email} ({n.author.role})
                  </small>
                )}
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(n.id);
                      setTitle(n.title);
                      setContent(n.content);
                    }}
                    className={`px-3 py-1 rounded ${
                      canEditOrDelete
                        ? "bg-yellow-500 text-black hover:bg-yellow-400"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!canEditOrDelete || loading}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className={`px-3 py-1 rounded ${
                      canEditOrDelete
                        ? "bg-red-600 text-white hover:bg-red-500"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!canEditOrDelete || loading}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Add / Edit Form */}
        <div className="mt-6 bg-gray-700 p-4 rounded">
          <h3 className="text-xl font-semibold mb-3">{editingId ? "Edit Note" : "Add Note"}</h3>

          {reachedLimit && !editingId ? (
            <div className="text-yellow-400 font-semibold mb-2">
              You have reached the limit of {noteLimit} notes for the FREE plan. Ask admin to upgrade.
            </div>
          ) : (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded mb-2"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Content"
                className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded mb-2"
                rows={3}
              />
              <button
                onClick={addOrUpdateNote}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400"
                disabled={loading}
              >
                {editingId ? "Update Note" : "Add Note"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setContent("");
                  }}
                  className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
