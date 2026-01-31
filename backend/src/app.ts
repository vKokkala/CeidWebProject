import express from "express";
import cors from "cors";
import multer from "multer";
import prisma from "./prisma.js";

const app = express();

app.use(cors());
app.use(express.json());

// Configure multer for memory storage (stores file as Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

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

app.post("/topic", upload.single("pdfFile"), async (req, res) => {
  const { professorId, title, description } = req.body;
  const file = req.file as Express.Multer.File | undefined;

  if (!professorId)
    return res.status(400).json({ error: "ProfessorId not provided" });

  const topic = await prisma.topic.create({
    data: {
      title: title,
      description: description,
      professor: { connect: { id: Number(professorId) } },
      ...(file && {
        pdfFile: Buffer.from(file.buffer),
        pdfFileName: file.originalname,
        pdfMimeType: file.mimetype,
        pdfSize: file.size,
      }),
    },
  });

  res.json(topic);
});

// Download PDF from topic
app.get("/topic/:id/pdf", async (req, res) => {
  const { id } = req.params;

  const topic = await prisma.topic.findUnique({
    where: { id: Number(id) },
    select: { pdfFile: true, pdfFileName: true, pdfMimeType: true },
  });

  if (!topic || !topic.pdfFile) {
    return res.status(404).json({ error: "PDF not found" });
  }

  res.setHeader("Content-Type", topic.pdfMimeType || "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${topic.pdfFileName}"`,
  );
  res.send(topic.pdfFile);
});

app.patch(
  "/topic/:id",
  upload.single("pdfFile"),
  async (req: MulterRequest, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file;

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
        ...(file && {
          pdfFile: Buffer.from(file.buffer),
          pdfFileName: file.originalname,
          pdfMimeType: file.mimetype,
          pdfSize: file.size,
        }),
      },
    });

    res.json(updatedTopic);
  },
);

export default app;
