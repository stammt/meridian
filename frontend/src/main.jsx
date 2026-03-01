import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import Login from "./pages/Login.jsx";
import AuthVerify from "./pages/AuthVerify.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Game from "./pages/Game.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", background: "#05060f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Share Tech Mono', monospace", color: "#c8830a",
      fontSize: "0.75rem", letterSpacing: "0.3em",
    }}>
      INITIALIZING...
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/verify" element={<AuthVerify />} />
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/story/:id" element={
            <ProtectedRoute><Game /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode><App /></StrictMode>
);
