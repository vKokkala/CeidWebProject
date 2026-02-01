import express from "express";
import cors from "cors";
import multer from "multer";
import prisma from "./prisma.js";
import type { Role } from "./generated/prisma/enums.js";
import { InvitationStatus } from "./generated/prisma/enums.js";
import { generateToken, authMiddleware } from "./middlewares/auth.js";

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

  const studentName = thesis.student?.user
    ? `${thesis.student.user.firstName} ${thesis.student.user.lastName}`
    : "Unknown";

  const supervisorName = thesis.supervisor?.user
    ? `${thesis.supervisor.user.firstName} ${thesis.supervisor.user.lastName}`
    : "Unknown";

  const committeeHtml = thesis.committeeMembers
    .map(
      (member) =>
        `<li>${member.professor?.user?.firstName} ${member.professor?.user?.lastName}</li>`,
    )
    .join("");

  const gradesHtml = thesis.grades
    .map(
      (grade) =>
        `<tr>
          <td>${grade.professor?.user?.firstName} ${grade.professor?.user?.lastName}</td>
          <td>${grade.totalGrade}</td>
          <td>${grade.comments || "-"}</td>
        </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Πρακτικό Εξέτασης - ${thesis.topic?.title || "Διπλωματική Εργασία"}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
      color: #333;
    }
    .report {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
      color: #1a237e;
      border-bottom: 2px solid #1a237e;
      padding-bottom: 20px;
    }
    h2 {
      color: #303f9f;
      margin-top: 30px;
    }
    .info-row {
      display: flex;
      margin: 12px 0;
    }
    .info-label {
      font-weight: bold;
      width: 200px;
      color: #555;
    }
    .info-value {
      flex: 1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #e8eaf6;
      color: #1a237e;
    }
    .final-grade {
      font-size: 24px;
      font-weight: bold;
      color: #2e7d32;
      text-align: center;
      padding: 20px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #777;
      font-size: 14px;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    ul li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    ul li:last-child {
      border-bottom: none;
    }
    @media print {
      body { background: white; }
      .report { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="report">
    <h1>Πρακτικό Εξέτασης Διπλωματικής Εργασίας</h1>

    <h2>Στοιχεία Εργασίας</h2>
    <div class="info-row">
      <span class="info-label">Τίτλος:</span>
      <span class="info-value">${thesis.topic?.title || "-"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Περιγραφή:</span>
      <span class="info-value">${thesis.topic?.description || "-"}</span>
    </div>

    <h2>Στοιχεία Φοιτητή</h2>
    <div class="info-row">
      <span class="info-label">Ονοματεπώνυμο:</span>
      <span class="info-value">${studentName}</span>
    </div>

    <h2>Επιβλέπων Καθηγητής</h2>
    <div class="info-row">
      <span class="info-label">Ονοματεπώνυμο:</span>
      <span class="info-value">${supervisorName}</span>
    </div>

    <h2>Τριμελής Επιτροπή</h2>
    <ul>
      <li><strong>${supervisorName}</strong> (Επιβλέπων)</li>
      ${committeeHtml}
    </ul>

    ${
      thesis.grades.length > 0
        ? `
    <h2>Βαθμολογία</h2>
    <table>
      <thead>
        <tr>
          <th>Μέλος Επιτροπής</th>
          <th>Βαθμός</th>
          <th>Σχόλια</th>
        </tr>
      </thead>
      <tbody>
        ${gradesHtml}
      </tbody>
    </table>
    `
        : ""
    }

    ${
      thesis.finalGrade
        ? `
    <div class="final-grade">
      Τελικός Βαθμός: ${thesis.finalGrade}
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>Ημερομηνία έκδοσης: ${new Date().toLocaleDateString("el-GR")}</p>
      ${thesis.nemertisLink ? `<p>Αποθετήριο: <a href="${thesis.nemertisLink}">${thesis.nemertisLink}</a></p>` : ""}
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
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

export default app;
