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

app.get("/topic", async (req, res) => {
  const { professorId } = req.query;

  if (!professorId)
    return res.status(400).json({ error: "ProfessorId not provided" });

  const topics = await prisma.topic.findMany({
    where: { professorId: Number(professorId) },
  });

  res.json(topics);
});

// // TODO -> uploading files
// app.post("/topic", async (req, res) => {
//   const { professorId, title, description, pdf } = req.query;

//   console.log()

//   if (!professorId)
//     return res.status(400).json({ error: "ProfessorId not provided" });

//   const topics = await prisma.topic.create({
//     data: {
//       title: title,
//       description: description,
//       extendedDescriptionPdf: pdf ? pdf : undefined,
//       professor: { connect: { id: Number(professorId) } },
//     },
//   });

//   res.json(topics);
// });

export default app;
