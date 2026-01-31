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

app.get("/user", async (req, res) => {
  const { userId } = req.query;

  if (!userId) return res.status(403).json({ error: "Missing user id" });

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: {
      student: true,
      professor: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

app.patch("/user/:id", async (req, res) => {
  const { id } = req.params;
  const { email, address, cellPhoneNumber, phoneNumber } = req.body;


  console.log('userId', id)

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      student: true,
      professor: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (email && user.email !== email) {
    // Update user email if provided
    await prisma.user.update({
      where: { id: Number(id) },
      data: {
        email: email,
      },
    });
  }

  // Update details only if query made by a user
  if (user.student) {
    await prisma.student.update({
      where: { id: user.student.id },
      data: {
        ...(address && { address }),
        ...(cellPhoneNumber && { cellPhoneNumber }),
        ...(phoneNumber && { phoneNumber }),
      },
    });
  }

  // Fetch the updated user with all relations
  const updatedUserDetails = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      student: true,
      professor: true,
    },
  });

  res.json(updatedUserDetails);
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

// TODO -> uploading files
app.post("/topic", async (req, res) => {
  const { professorId, title, description, pdf } = req.body;

  if (!professorId)
    return res.status(400).json({ error: "ProfessorId not provided" });

  const topics = await prisma.topic.create({
    data: {
      title: title,
      description: description,
      extendedDescriptionPdf: pdf,
      professor: { connect: { id: Number(professorId) } },
    },
  });

  res.json(topics);
});

app.patch("/topic/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, extendedDescriptionPdf } = req.body;

  console.log('id', id)

  const topic = await prisma.topic.findUnique({
    where: { id: Number(id) },
  });

  if (!topic) {
    return res.status(404).json({ error: "Topic not found" });
  }

  const updatedTopic = await prisma.topic.update({
    where: { id: Number(id) },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(extendedDescriptionPdf && { extendedDescriptionPdf }),
    },
  });

  res.json(updatedTopic);
});

export default app;
