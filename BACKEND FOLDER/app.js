import express from "express";
import usersRoutes from "./models/routes/users.routes.js";
import postRoutes from "./models/routes/post.routes.js";

const app = express();  // create an express app

app.use(express.json());  // middleware to parse JSON bodies

app.use("/api/users", usersRoutes);  // use the users routes
app.use("/api/posts", postRoutes);  // use the posts routes

export default app;