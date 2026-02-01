import express from "express";
import cors from "cors";
import multer from "multer";
import prisma from "./prisma.js";
import type { Role } from "./generated/prisma/enums.js";
import { InvitationStatus } from "./generated/prisma/enums.js";
import { generateToken, authMiddleware } from "./middlewares/auth.js";
import xmlbuilder from "xmlbuilder";
import type { ThesisPresentationAnnouncementWhereInput } from "./generated/prisma/models.js";

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
 * Login (public)
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
      student: {
        include: {
          thesis: {
            select: {
              id: true,
            },
          },
        },
      },
      professor: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
});

/**
 * Public thesis presentation announcements enbdpoint
 */
app.get("/announcements", async (req, res) => {
  const { timeFrom, timeTo, format = "json" } = req.query;

  const where: ThesisPresentationAnnouncementWhereInput = {};

  if (timeFrom || timeTo) {
    where.createdAt = {};

    if (timeFrom) {
      where.createdAt.gte = new Date(timeFrom as string);
    }

    if (timeTo) {
      where.createdAt.lte = new Date(timeTo as string);
    }
  }

  const announcements = await prisma.thesisPresentationAnnouncement.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      thesis: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
          supervisor: {
            include: {
              user: true,
            },
          },
          topic: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (format === "xml") {
    const xml = xmlbuilder
      .create("announcements")
      .att("count", announcements.length);

    announcements.forEach((a) => {
      xml
        .ele("announcement")
        .ele("id", a.id)
        .up()
        .ele("createdAt", a.createdAt.toISOString())
        .up()
        .ele("text", a.text)
        .up();
    });

    res.type("application/xml").send(xml.end({ pretty: true }));
  } else {
    res.json({
      count: announcements.length,
      data: announcements,
    });
  }
});

// Apply auth middleware to all routes below this point
app.use(authMiddleware);

/**
 * Get all users
 */
app.get("/users", async (req, res) => {
  const { role } = req.query;

  if (
    role &&
    (typeof role !== "string" ||
      !["STUDENT", "PROFESSOR", "SECRETARIAT"].includes(role))
  ) {
    return res.status(400).json({ error: "Bad request" });
  }

  const users = await prisma.user.findMany({
    ...(role && {
      where: {
        role: role as Role,
      },
    }),
    include: {
      student: {
        include: {
          thesis: {
            select: {
              id: true,
            },
          },
        },
      },
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
      student: {
        include: {
          thesis: {
            select: {
              id: true,
            },
          },
        },
      },
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

app.get("/topic", async (req, res) => {
  const { professorId } = req.query;

  if (!professorId)
    return res.status(400).json({ error: "ProfessorId not provided" });

  const topics = await prisma.topic.findMany({
    where: { professorId: Number(professorId) },
    select: {
      id: true,
      title: true,
      description: true,
      isAssigned: true,
      professorId: true,
      pdfFileName: true,
    },
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
    select: {
      id: true,
      title: true,
      description: true,
      isAssigned: true,
      professorId: true,
      pdfFileName: true,
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

app.patch("/topic/:id", upload.single("pdfFile"), async (req, res) => {
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
    select: {
      id: true,
      title: true,
      description: true,
      isAssigned: true,
      professorId: true,
      pdfFileName: true,
    },
  });

  res.json(updatedTopic);
});

app.post("/thesis", async (req, res) => {
  const { professorId, topicId, studentId, supervisorId } = req.body;

  if (!professorId || !topicId || !studentId || !supervisorId) {
    return res.status(400).json({
      error:
        "Missing required fields: professorId, topicId, studentId, supervisorId",
    });
  }

  // Check if topic exists and is not already assigned
  const topic = await prisma.topic.findUnique({
    where: { id: Number(topicId) },
  });

  if (!topic) {
    return res.status(404).json({ error: "Topic not found" });
  }

  if (topic.isAssigned) {
    return res.status(400).json({ error: "Topic is already assigned" });
  }

  // Check if student exists and doesn't already have a thesis
  const student = await prisma.student.findUnique({
    where: { id: Number(studentId) },
    include: { thesis: true },
  });

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  if (student.thesis) {
    return res
      .status(400)
      .json({ error: "Student already has a thesis assigned" });
  }

  // Create thesis and mark topic as assigned
  const thesis = await prisma.thesis.create({
    data: {
      professor: { connect: { id: Number(professorId) } },
      topic: { connect: { id: Number(topicId) } },
      student: { connect: { id: Number(studentId) } },
      supervisor: { connect: { id: Number(supervisorId) } },
    },
  });

  // Mark topic as assigned
  await prisma.topic.update({
    where: { id: Number(topicId) },
    data: { isAssigned: true },
  });

  res.json(thesis);
});

app.get("/thesis", async (req, res) => {
  const theses = await prisma.thesis.findMany({
    include: {
      professor: {
        include: {
          user: true,
        },
      },
      topic: {
        select: {
          id: true,
          title: true,
          description: true,
          isAssigned: true,
          professorId: true,
          pdfFileName: true,
        },
      },
      student: {
        include: {
          user: true,
        },
      },
      supervisor: {
        include: {
          user: true,
        },
      },
      committeeMembers: {
        include: {
          professor: true,
        },
      },
    },
  });

  res.json(theses);
});

app.get("/thesis/:id", async (req, res) => {
  const { id } = req.params;

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
    include: {
      professor: {
        include: {
          user: true,
        },
      },
      topic: {
        select: {
          id: true,
          title: true,
          description: true,
          isAssigned: true,
          professorId: true,
          pdfFileName: true,
        },
      },
      student: {
        include: {
          user: true,
        },
      },
      supervisor: {
        include: {
          user: true,
        },
      },
      committeeMembers: {
        include: {
          professor: {
            include: {
              user: true,
            },
          },
        },
      },
      committeeInvitations: {
        include: {
          professor: {
            include: {
              user: true,
            },
          },
        },
      },
      statusChanges: {
        orderBy: {
          changedAt: "desc",
        },
      },
      grades: {
        include: {
          professor: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  res.json(thesis);
});

// Update thesis fields
app.patch("/thesis/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nemertisLink,
    relevantLinks,
    isGradingEnabled,
    examinationDate,
    examinationMode,
    examinationPlace,
  } = req.body;

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  const updatedThesis = await prisma.thesis.update({
    where: { id: Number(id) },
    data: {
      ...(nemertisLink && { nemertisLink }),
      ...(relevantLinks && { relevantLinks }),
      ...(isGradingEnabled && { isGradingEnabled }),
      ...(examinationDate && {
        examinationDate: examinationDate ? new Date(examinationDate) : null,
      }),
      ...(examinationMode && { examinationMode }),
      ...(examinationPlace && { examinationPlace }),
    },
  });

  res.json(updatedThesis);
});

app.post("/thesis/:id/grades", async (req, res) => {
  const { id } = req.params;
  const { professorId, grade } = req.body;

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
    include: {
      committeeMembers: {
        include: {
          professor: true,
        },
      },
      grades: true,
    },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  const isCommitteeMember = thesis.committeeMembers.find(
    (x) => x.professorId == Number(professorId),
  );

  const supervisorId = thesis.supervisorId;

  if (!isCommitteeMember && supervisorId !== Number(professorId))
    return res.status(400).json({ error: "Bad request, not committe member" });

  if (0 > Number(grade) || Number(grade) > 10)
    return res.status(400).json({ error: "Bad request, invalid grade value" });

  if (thesis?.grades?.length === 2) {
    const finalValue =
      (thesis.grades.reduce((sum, g) => sum + Number(g.totalGrade ?? 0), 0) +
        Number(grade)) /
      3;

    await prisma.$transaction([
      prisma.thesis.update({
        where: { id: thesis.id },
        data: {
          finalGrade: finalValue,
          completedAt: new Date(),
          status: "COMPLETED",
        },
      }),
      prisma.grade.create({
        data: {
          totalGrade: Number(grade),
          thesis: { connect: { id: Number(id) } },
          professor: { connect: { id: Number(professorId) } },
        },
      }),
      prisma.thesisStatusChange.create({
        data: {
          fromStatus: "UNDER_EXAMINATION",
          toStatus: "COMPLETED",
          changedBy: "Stystem",
          notes: "All professors graded",
          thesisId: thesis.id,
        },
      }),
    ]);

    return res.json({ error: "Graded successfully" });
  }

  const newGrade = await prisma.grade.create({
    data: {
      totalGrade: Number(grade),
      thesis: { connect: { id: Number(id) } },
      professor: { connect: { id: Number(professorId) } },
    },
  });

  res.json(newGrade);
});


// Upload thesis document
app.post(
  "/thesis/:id/document",
  upload.single("document"),
  async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No document file provided" });
    }

    const thesis = await prisma.thesis.findUnique({
      where: { id: Number(id) },
    });

    if (!thesis) {
      return res.status(404).json({ error: "Thesis not found" });
    }

    await prisma.thesis.update({
      where: { id: Number(id) },
      data: {
        thesisDocument: Buffer.from(file.buffer),
      },
    });

    res.json({ message: "Document uploaded successfully" });
  },
);

// Download thesis document
app.get("/thesis/:id/document", async (req, res) => {
  const { id } = req.params;

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
    select: { thesisDocument: true, topic: { select: { title: true } } },
  });

  if (!thesis || !thesis.thesisDocument) {
    return res.status(404).json({ error: "Document not found" });
  }

  const filename = `thesis-draft-${id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.send(thesis.thesisDocument);
});

// Get examination report as HTML
app.get("/thesis/:id/examination-report", async (req, res) => {
  const { id } = req.params;

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
    include: {
      topic: true,
      student: {
        include: {
          user: true,
        },
      },
      supervisor: {
        include: {
          user: true,
        },
      },
      committeeMembers: {
        include: {
          professor: {
            include: {
              user: true,
            },
          },
        },
      },
      grades: {
        include: {
          professor: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }


  // TODO
});

app.post("/thesis/:id/committee", async (req, res) => {
  const { id } = req.params;
  const { professorId } = req.body;

  if (!professorId) {
    return res.status(400).json({ error: "professorId is required" });
  }

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
    include: { committeeMembers: true, committeeInvitations: true },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  // Check if professor is already a committee member
  const isAlreadyMember = thesis.committeeMembers.some(
    (member) => member.professorId === Number(professorId),
  );

  const hadAlreadyRequested = thesis.committeeInvitations.some(
    (invitation) => invitation.professorId === Number(professorId),
  );

  if (isAlreadyMember) {
    return res
      .status(400)
      .json({ error: "Professor is already a committee member" });
  }

  if (hadAlreadyRequested) {
    return res.status(400).json({
      error: "Professor has already been invited to be a committee member",
    });
  }

  // Check if professor is the supervisor
  if (thesis.supervisorId === Number(professorId)) {
    return res
      .status(400)
      .json({ error: "Supervisor cannot be added as committee member" });
  }

  const committeeMember = await prisma.committeeInvitation.create({
    data: {
      Role: "MEMBER",
      thesis: { connect: { id: Number(id) } },
      professor: { connect: { id: Number(professorId) } },
    },
    include: {
      professor: {
        include: {
          user: true,
        },
      },
    },
  });

  res.json(committeeMember);
});

// Get invitations for a professor
app.get("/invitation", async (req, res) => {
  const { professorId } = req.query;

  if (!professorId) {
    return res.status(400).json({ error: "professorId is required" });
  }

  const invitations = await prisma.committeeInvitation.findMany({
    where: {
      professorId: Number(professorId),
      invitationStatus: "PENDING",
    },
    include: {
      thesis: {
        include: {
          topic: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(invitations);
});

// Accept invitation
app.post("/invitation/:id/accept", async (req, res) => {
  const { id } = req.params;

  const invitation = await prisma.committeeInvitation.findUnique({
    where: { id: Number(id) },
  });

  if (!invitation) {
    return res.status(404).json({ error: "Invitation not found" });
  }

  if (invitation.invitationStatus !== "PENDING") {
    return res.status(400).json({ error: "Invitation already responded" });
  }

  // Update invitation status and create committee member
  await prisma.$transaction([
    prisma.committeeInvitation.update({
      where: { id: Number(id) },
      data: { invitationStatus: "ACCEPTED" },
    }),
    prisma.committeeMember.create({
      data: {
        role: invitation.Role,
        thesisId: invitation.thesisId,
        professorId: invitation.professorId,
      },
    }),
  ]);

  // Check if thesis now has at least 2 committee members
  const thesis = await prisma.thesis.findUnique({
    where: { id: invitation.thesisId },
    include: { committeeMembers: true },
  });

  if (thesis && thesis.status === "UNDER_ASSIGNMENT" && thesis.committeeMembers.length >= 2) {
    await prisma.$transaction([
      prisma.thesis.update({
        where: { id: thesis.id },
        data: {
          status: "ACTIVE",
          officialAssignmentDate: new Date(),
        },
      }),
      prisma.thesisStatusChange.create({
        data: {
          fromStatus: "UNDER_ASSIGNMENT",
          toStatus: "ACTIVE",
          changedBy: "System",
          notes: "Committee formed with 2+ members",
          thesisId: thesis.id,
        },
      }),
      prisma.committeeInvitation.updateMany({
        where: {
          thesisId: thesis.id,
          invitationStatus: InvitationStatus.PENDING,
        },
        data: {
          invitationStatus: InvitationStatus.CANCELLED,
        },
      }),
    ]);
  }

  res.json({ message: "Invitation accepted" });
});

// Reject invitation
app.post("/invitation/:id/reject", async (req, res) => {
  const { id } = req.params;

  const invitation = await prisma.committeeInvitation.findUnique({
    where: { id: Number(id) },
  });

  if (!invitation) {
    return res.status(404).json({ error: "Invitation not found" });
  }

  if (invitation.invitationStatus !== "PENDING") {
    return res.status(400).json({ error: "Invitation already responded" });
  }

  await prisma.committeeInvitation.update({
    where: { id: Number(id) },
    data: { invitationStatus: "REJECTED" },
  });

  res.json({ message: "Invitation rejected" });
});

// Cancel thesis assignment (supervisor only, only when UNDER_ASSIGNMENT)
app.post("/thesis/:id/cancel-assignment", async (req, res) => {
  const { id } = req.params;
  const { supervisorId, reason } = req.body;

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  if (thesis.status !== "UNDER_ASSIGNMENT") {
    return res.status(400).json({ error: "Can only cancel during UNDER_ASSIGNMENT status" });
  }

  if (thesis.supervisorId !== Number(supervisorId)) {
    return res.status(403).json({ error: "Only the supervisor can cancel the assignment" });
  }

  await prisma.$transaction([
    // Delete all committee members
    prisma.committeeMember.deleteMany({
      where: { thesisId: thesis.id },
    }),
    // Delete all committee invitations
    prisma.committeeInvitation.deleteMany({
      where: { thesisId: thesis.id },
    }),
    prisma.thesisStatusChange.deleteMany({
      where: { thesisId: thesis.id },
    }),
    // Mark topic as unassigned
    prisma.topic.update({
      where: { id: thesis.topicId! },
      data: { isAssigned: false },
    }),
    prisma.thesis.delete({
      where: { id: thesis.id },
    }),
  ]);

  res.json({ message: "Assignment cancelled successfully" });
});

app.get("/thesis/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { professorId } = req.query;

  if (!professorId) {
    return res.status(400).json({ error: "professorId is required" });
  }

  const notes = await prisma.thesisNote.findMany({
    where: {
      thesisId: Number(id),
      professorId: Number(professorId),
    },
    orderBy: {
      id: "desc",
    },
  });

  res.json(notes);
});

// Create a note for a thesis
app.post("/thesis/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { professorId, note } = req.body;

  if (!professorId || !note) {
    return res.status(400).json({ error: "ProfessorId and note are required" });
  }

  if (note.length > 300) {
    return res.status(400).json({ error: "Note must be 300 characters or less" });
  }

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  if (thesis.status !== "ACTIVE") {
    return res.status(400).json({ error: "Notes can only be added to active theses" });
  }

  const newNote = await prisma.thesisNote.create({
    data: {
      note,
      thesisId: Number(id),
      professorId: Number(professorId),
    },
  });

  res.json(newNote);
});

app.post("/thesis/:id/start-examination", async (req, res) => {
  const { id } = req.params;
  const { supervisorId } = req.body;

  if (!supervisorId) {
    return res.status(400).json({ error: "supervisorId is required" });
  }

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  if (thesis.status !== "ACTIVE") {
    return res.status(400).json({ error: "Thesis must be in ACTIVE status" });
  }

  if (thesis.supervisorId !== Number(supervisorId)) {
    return res.status(403).json({ error: "Only the supervisor can change the status" });
  }

  await prisma.$transaction([
    prisma.thesis.update({
      where: { id: thesis.id },
      data: { status: "UNDER_EXAMINATION" },
    }),
    prisma.thesisStatusChange.create({
      data: {
        fromStatus: "ACTIVE",
        toStatus: "UNDER_EXAMINATION",
        changedBy: "Supervisor",
        notes: "Thesis moved to examination phase",
        thesisId: thesis.id,
      },
    }),
  ]);

  res.json({ message: "Thesis status changed to UNDER_EXAMINATION" });
});

// Create presentation announcement (supervisor only, when ACTIVE and details filled)
app.post("/thesis/:id/announcement", async (req, res) => {
  const { id } = req.params;
  const { supervisorId, text } = req.body;

  if (!supervisorId) {
    return res.status(400).json({ error: "supervisorId is required" });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Announcement text is required" });
  }

  const thesis = await prisma.thesis.findUnique({
    where: { id: Number(id) },
  });

  if (!thesis) {
    return res.status(404).json({ error: "Thesis not found" });
  }

  if (thesis.status !== "UNDER_EXAMINATION") {
    return res.status(400).json({ error: "Thesis must be in under examination status" });
  }

  if (thesis.supervisorId !== Number(supervisorId)) {
    return res.status(403).json({ error: "Only the supervisor can create the announcement" });
  }

  if (!thesis.examinationDate || !thesis.examinationMode || !thesis.examinationPlace) {
    return res.status(400).json({
      error: "Presentation details must be filled by the student first (date, mode, place)"
    });
  }

  const existingAnnouncement = await prisma.thesisPresentationAnnouncement.findFirst({
    where: { thesisId: Number(id) },
  });

  if (existingAnnouncement) {
    return res.status(400).json({ error: "Announcement already exists for this thesis" });
  }

  const announcement = await prisma.thesisPresentationAnnouncement.create({
    data: {
      text: text.trim(),
      thesisId: Number(id),
    },
  });

  res.json(announcement);
});

export default app;
