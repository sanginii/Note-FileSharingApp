import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { noteRoutes } from "./routes/notes.js";
import { fileRoutes } from "./routes/files.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: "https://note-file-sharing-app-frontend.vercel.app",
    //process.env.FRONTEND_URL
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing - increased limit for encrypted file uploads
// Base64 encoding increases size by ~33%, so 50MB limit allows ~37MB files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/notes", noteRoutes);
app.use("/api/files", fileRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT:${PORT}`);
});
