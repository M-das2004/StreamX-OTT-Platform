import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  adminGetUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminGetAnalytics,
  adminCreateMovie,
  adminUpdateMovie,
  adminDeleteMovie,
  fetchAllContent,
} from "../services/api";

function StatCard({ label, value }) {
  return (
    <div className="profile-option" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "22px", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  type: "movie",
  year: "",
  rating: "",
  duration: "",
  genres: "",
  image: "",
  description: "",
  director: "",
  cast: "",
  videoUrl: "",
};

// Converts a Movie doc (arrays) into form state (comma-separated strings)
function movieToForm(movie) {
  return {
    title: movie.title,
    type: movie.type,
    year: movie.year,
    rating: movie.rating,
    duration: movie.duration,
    genres: movie.genres.join(", "),
    image: movie.image,
    description: movie.description,
    director: movie.director,
    cast: movie.cast.join(", "),
    videoUrl: movie.videoUrl,
  };
}

// Converts form state back into the payload the backend expects
function formToPayload(form) {
  return {
    title: form.title.trim(),
    type: form.type,
    year: Number(form.year),
    rating: Number(form.rating),
    duration: form.duration.trim(),
    genres: form.genres.split(",").map((g) => g.trim()).filter(Boolean),
    image: form.image.trim(),
    description: form.description.trim(),
    director: form.director.trim(),
    cast: form.cast.split(",").map((c) => c.trim()).filter(Boolean),
    videoUrl: form.videoUrl.trim(),
  };
}

function Admin() {
  const { user: currentUser } = useAuth();

  // Users
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Movies
  const [movies, setMovies] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingMovie, setSavingMovie] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingMovieId, setDeletingMovieId] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetAnalytics(), fetchAllContent()]).then(
      ([u, a, m]) => {
        setUsers(u);
        setAnalytics(a);
        setMovies(m);
        setLoading(false);
      }
    );
  }, []);

  // --- Users -----------------------------------------------------------

  async function handleRoleChange(id, role) {
    setBusyId(id);
    const updated = await adminUpdateUser(id, { role });
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    setBusyId(null);
  }

  async function handleToggleSuspend(u) {
    setBusyId(u.id);
    const updated = await adminUpdateUser(u.id, { suspended: !u.suspended });
    setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    setBusyId(null);
  }

  async function handleDeleteUser(id) {
    if (!window.confirm("Delete this user permanently? This can't be undone.")) return;
    setBusyId(id);
    await adminDeleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setBusyId(null);
  }

  // --- Movies ------------------------------------------------------------

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(movie) {
    setEditingId(movie.id);
    setForm(movieToForm(movie));
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmitMovie(e) {
    e.preventDefault();
    setFormError("");

    if (!form.title || !form.year || !form.duration || !form.image || !form.description) {
      setFormError("Title, year, duration, image and description are required.");
      return;
    }

    setSavingMovie(true);
    try {
      const payload = formToPayload(form);

      if (editingId) {
        const updated = await adminUpdateMovie(editingId, payload);
        setMovies((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      } else {
        const created = await adminCreateMovie(payload);
        setMovies((prev) => [...prev, created]);
      }

      closeForm();
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSavingMovie(false);
    }
  }

  async function handleDeleteMovie(id) {
    if (!window.confirm("Delete this title permanently? This can't be undone.")) return;
    setDeletingMovieId(id);
    try {
      await adminDeleteMovie(id);
      setMovies((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) closeForm();
    } finally {
      setDeletingMovieId(null);
    }
  }

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <main className="profile-page">
      <div className="profile-container" style={{ maxWidth: "960px" }}>
        <h1>Admin Dashboard</h1>
        <p>User management, movie catalog moderation, and platform analytics.</p>

        {analytics && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              margin: "10px 0 30px",
            }}
          >
            <StatCard label="Users" value={analytics.totalUsers} />
            <StatCard label="Movies" value={analytics.totalMovies} />
            <StatCard label="Series" value={analytics.totalSeries} />
            <StatCard label="Ratings" value={analytics.totalRatings} />
            <StatCard label="Active Subs" value={analytics.activeSubscriptions} />
            <StatCard label="Avg Rating" value={analytics.averageRating ?? "—"} />
          </div>
        )}

        {/* ================= USERS ================= */}

        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Users</h2>

        <div className="profile-option" style={{ padding: 0, overflowX: "auto", marginBottom: "36px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px" }}>Name</th>
                <th style={{ padding: "10px" }}>Email</th>
                <th style={{ padding: "10px" }}>Role</th>
                <th style={{ padding: "10px" }}>Status</th>
                <th style={{ padding: "10px" }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px" }}>{u.name}</td>
                    <td style={{ padding: "10px", color: "var(--text-muted)" }}>{u.email}</td>
                    <td style={{ padding: "10px" }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={busyId === u.id || isSelf}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td style={{ padding: "10px" }}>
                      {u.suspended ? (
                        <span className="unverified-badge">Suspended</span>
                      ) : (
                        <span className="verified-badge">Active</span>
                      )}
                    </td>
                    <td style={{ padding: "10px", display: "flex", gap: "8px" }}>
                      <button
                        className="mini-btn"
                        onClick={() => handleToggleSuspend(u)}
                        disabled={busyId === u.id || isSelf}
                      >
                        {u.suspended ? "Unsuspend" : "Suspend"}
                      </button>
                      <button
                        className="mini-btn"
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={busyId === u.id || isSelf}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ================= MOVIE CATALOG ================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ fontSize: "18px", margin: 0 }}>Movie Catalog</h2>
          <button className="save-btn" style={{ marginTop: 0 }} onClick={openCreateForm}>
            + Add New Title
          </button>
        </div>

        {formOpen && (
          <div className="profile-option" style={{ marginBottom: "20px" }}>
            <h3>{editingId ? "Edit Title" : "Add New Title"}</h3>

            {formError && <div className="form-error">{formError}</div>}

            <form onSubmit={handleSubmitMovie} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
                <input
                  type="number"
                  placeholder="Year"
                  value={form.year}
                  onChange={(e) => updateField("year", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="Rating (0-10)"
                  value={form.rating}
                  onChange={(e) => updateField("rating", e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <input
                type="text"
                placeholder="Duration (e.g. 2h 15m or 3 Seasons)"
                value={form.duration}
                onChange={(e) => updateField("duration", e.target.value)}
              />

              <input
                type="text"
                placeholder="Genres, comma-separated (e.g. Action, Drama)"
                value={form.genres}
                onChange={(e) => updateField("genres", e.target.value)}
              />

              <input
                type="text"
                placeholder="Image URL"
                value={form.image}
                onChange={(e) => updateField("image", e.target.value)}
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "10px 12px",
                  color: "var(--text)",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />

              <input
                type="text"
                placeholder="Director"
                value={form.director}
                onChange={(e) => updateField("director", e.target.value)}
              />

              <input
                type="text"
                placeholder="Cast, comma-separated"
                value={form.cast}
                onChange={(e) => updateField("cast", e.target.value)}
              />

              <input
                type="text"
                placeholder="Video URL"
                value={form.videoUrl}
                onChange={(e) => updateField("videoUrl", e.target.value)}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button className="save-btn" type="submit" disabled={savingMovie} style={{ marginTop: 0 }}>
                  {savingMovie ? "Saving..." : editingId ? "Save Changes" : "Add Title"}
                </button>
                <button type="button" className="mini-btn" onClick={closeForm} disabled={savingMovie}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="profile-option" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px" }}>Title</th>
                <th style={{ padding: "10px" }}>Type</th>
                <th style={{ padding: "10px" }}>Year</th>
                <th style={{ padding: "10px" }}>Rating</th>
                <th style={{ padding: "10px" }}></th>
              </tr>
            </thead>
            <tbody>
              {movies.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px" }}>{m.title}</td>
                  <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.type}</td>
                  <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.year}</td>
                  <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.rating}</td>
                  <td style={{ padding: "10px", display: "flex", gap: "8px" }}>
                    <button className="mini-btn" onClick={() => openEditForm(m)}>
                      Edit
                    </button>
                    <button
                      className="mini-btn"
                      onClick={() => handleDeleteMovie(m.id)}
                      disabled={deletingMovieId === m.id}
                    >
                      {deletingMovieId === m.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default Admin;
