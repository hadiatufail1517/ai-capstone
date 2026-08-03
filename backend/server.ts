import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const port = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://chatbot-6qlw.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if the origin matches any allowed origin, is local development, or ends with .vercel.app
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.endsWith(".vercel.app");

      if (isAllowed) {
        return callback(null, true);
      }

      console.error("Blocked by CORS:", origin);
      // Return callback(null, false) instead of passing an Error object.
      // This prevents Express from throwing a 500 error and allows the browser to block the request.
      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// Chat API
app.use("/api/chat", chatRouter);

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`Health Check: /api/health`);
});