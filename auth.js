// auth.js
import "dotenv/config";
import jwt from "jsonwebtoken";

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return process.env.JWT_SECRET;
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: "7d"
  });
}

export function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header"
    });
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}
