import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Enable CORS for all requests (frontend can access backend)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Add request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Auth routes
app.use("/api/auth", authRoutes);

// Swagger docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "basic-backend"
  });
});

// User registration route
app.post("/api/users/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
      requiredFields: ["username", "email", "password"]
    });
  }

  const mockUserId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: mockUserId,
      username,
      email
    },
    timestamp: new Date().toISOString()
  });
});

// Post creation route
app.post("/api/post/create", (req, res) => {
  const { title, name, description, content, age } = req.body;

  if (!title || !name || !description || !content || !age) {
    return res.status(400).json({
      message: "All fields are required",
      requiredFields: ["title", "name", "description", "content", "age"]
    });
  }

  const mockPostId = `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  res.status(201).json({
    id: mockPostId,
    title,
    name,
    description,
    content,
    age,
    createdAt: new Date().toISOString()
  });
});

// Get all posts
app.get("/api/posts", (req, res) => {
  console.log("GET /api/posts called");
  res.status(200).json({
    message: "Posts retrieved successfully",
    posts: [
      {
        id: "post_123",
        title: "Sample Post 1",
        name: "John Doe",
        description: "Sample description",
        content: "Sample content",
        age: 25,
        createdAt: "2024-01-15T10:30:00Z"
      },
      {
        id: "post_456",
        title: "Sample Post 2",
        name: "Jane Smith",
        description: "Another description",
        content: "More content here",
        age: 30,
        createdAt: "2024-01-16T14:45:00Z"
      }
    ]
  });
});

// Get single post by ID
app.get("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/posts/${id} called`);

  res.status(200).json({
    id,
    title: `Post: ${id}`,
    name: "John Doe",
    description: `This is post with ID: ${id}`,
    content: "Content of the sample post retrieved by ID",
    age: 28,
    createdAt: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Route not found",
    path: req.url,
    method: req.method,
    availableRoutes: [
      "GET /",
      "GET /health",
      "POST /api/users/register",
      "POST /api/post/create",
      "GET /api/posts",
      "GET /api/posts/:id"
    ]
  });
});

// Start server
async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 Available endpoints:`);
      console.log(`   GET  /`);
      console.log(`   GET  /health`);
      console.log(`   POST /api/users/register`);
      console.log(`   POST /api/post/create`);
      console.log(`   GET /api/posts`);
      console.log(`   GET /api/posts/:id`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();