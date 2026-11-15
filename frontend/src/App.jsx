import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Search from "./pages/Search";
import Series from "./pages/Series";
import MovieDetails from "./pages/MovieDetails";
import Watch from "./pages/Watch";
import Profile from "./pages/Profile";
import Watchlist from "./pages/Watchlist";
import Subscription from "./pages/Subscription";
import Admin from "./pages/Admin";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";
import FAQ from "./pages/FAQ";

// Pages that require a logged-in user. Redirects to /login and remembers
// where the visitor was headed so we can send them back after they sign in.
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Pages that additionally require role === "admin". The backend enforces
// this independently on every admin API call — this is just so a non-admin
// visiting /admin directly gets redirected instead of seeing a broken page.
function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// "/" shows the pre-signup marketing page to logged-out visitors and the
// real browsing homepage to signed-in ones — same URL, same nav link, no
// separate route to keep in sync.
function Root() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;
  return isAuthenticated ? <Home /> : <Landing />;
}

function App() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // The landing page ships its own header/footer-free layout (a marketing
  // splash page), so we skip the app chrome only for that exact case.
  const isBareLanding = location.pathname === "/" && !loading && !isAuthenticated;

  return (
    <div className="app-shell">
      {!isBareLanding && <Navbar />}

      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/search" element={<Search />} />
        <Route path="/series" element={<Series />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/help" element={<Help />} />
        <Route path="/faq" element={<FAQ />} />
        <Route
          path="/watch/:id"
          element={
            <ProtectedRoute>
              <Watch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isBareLanding && <Footer />}
    </div>
  );
}

export default App;
