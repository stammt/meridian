import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/login?error=missing_token", { replace: true });
      return;
    }

    api.auth.verify(token)
      .then(({ user }) => {
        setUser(user);
        navigate("/", { replace: true });
      })
      .catch((err) => {
        const error = err.message || "server_error";
        navigate(`/login?error=${error}`, { replace: true });
      });
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "#05060f",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#c8830a", fontFamily: "monospace", fontSize: "0.75rem", letterSpacing: "0.3em",
    }}>
      VERIFYING...
    </div>
  );
}
