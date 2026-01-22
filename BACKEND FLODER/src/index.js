import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err.message));

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Health check endpoint (for monitoring)
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
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   GET  /`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/users/register`);
  console.log(`   POST /api/post/create`);
  console.log(`   GET  /api/posts`);
  console.log(`   GET  /api/posts/:id`);
});