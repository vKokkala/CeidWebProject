import express from "express";
import cors from "cors";
import prisma from "./prisma.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "Thesis Assignment API",
    status: "running",
  });
});

/**
 * Get all users
 */
app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      student: true,
      professor: true,
    },
  });
  res.json(users);
});

/**
 * Login
 */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Both username and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      student: true,
      professor: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { password: _, ...rest } = user;
  res.json(rest);
});

export default app;
