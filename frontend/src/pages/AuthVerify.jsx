// This page is never actually rendered — the verify endpoint on the backend
// redirects directly to / after setting the cookie. But if something goes wrong
// and the user lands here, we handle it gracefully.
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      navigate(`/login?error=${error}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
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
