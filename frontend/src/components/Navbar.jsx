import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();

    const searchQuery = query.trim();

    if (!searchQuery) {
      navigate("/search");
      return;
    }

    navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">StreamX</Link>
      </div>

      <div className="nav-links">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/search">Movies</NavLink>
        <NavLink to="/series">Series</NavLink>
        <NavLink to="/watchlist">My List</NavLink>
      </div>

      <div className="nav-right">
      <form className="navbar-search" onSubmit={handleSearch}>
        <input type="search" className="my-search-bar" id="site-search" name="q" placeholder="Search for movies, series..." value={query}
            onChange={(e) => setQuery(e.target.value)}></input>
        <Link to="/search" className="search-btn" aria-label="Search">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
        </Link>
      </form>
        {isAuthenticated ? (
          <>
            {user?.role === "admin" && (
              <Link to="/admin" className="mini-btn" style={{ marginRight: "4px" }}>
                Admin
              </Link>
            )}
            <Link to="/profile" className="profile-btn" aria-label="Profile" title={user?.name}>
              <i class="fa-solid fa-user user-icon"></i>
            </Link>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <div className="nav-auth-links">
            <Link to="/login">Login</Link>
            <Link to="/register" className="signup-btn">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
