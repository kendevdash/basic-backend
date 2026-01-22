import { Router } from "express";
import { create, getAllPosts, getPostById, updatePost, deletePost } from "../controllers/post.controller.js";

const router = Router();

// Create a new post
router.post("/create", create);

// Get all posts
router.get("/all", getAllPosts);

// Get single post by ID
router.get("/:id", getPostById);

// Update post by ID
router.put("/:id", updatePost);

// Delete post by ID
router.delete("/:id", deletePost);

export default router;