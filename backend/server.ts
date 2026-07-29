import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS allowing requests from our Vite frontend dynamically (on any localhost port)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches localhost on any port
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Middleware to parse incoming JSON payloads
app.use(express.json());

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Chat api route
app.use('/api/chat', chatRouter);

// Start the Express server
app.listen(port, () => {
  console.log(`[Server] Express server running on port http://localhost:${port}`);
  console.log(`[Server] Health check available at http://localhost:${port}/api/health`);
});
