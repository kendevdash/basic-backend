import Post from "../model/post.js";

/* ================= CREATE POST ================= */
export const createPost = async (req, res) => {
  try {
    const { title, name, description, content, age } = req.body;

    // Validate input
    if (!title || !name || !description || !content || !age) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create post
    const newPost = await Post.create({
      title,
      name,
      description,
      content,
      age,
    });
    // read all posts
    const getPosts = await Post.find({});
    

    // Return exactly what Postman expects
    res.status(201).json({
      id: newPost._id,
      title: newPost.title,
      name: newPost.name,
      description: newPost.description,
      content: newPost.content,
      age: newPost.age,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
