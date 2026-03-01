import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.session;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Session expired or invalid" });
  }
}
