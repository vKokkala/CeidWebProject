import express from "express";
import cors from "cors";
import pool from "./db.js";
import { initializeDatabase } from "./initDb.js";

const app = express();

app.use(cors());
app.use(express.json());

// Initialize database when app starts
initializeDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
});

// Health check route
app.get("/", (req, res) => {
    res.json({
        message: "Thesis Assignment API",
        status: "running"
    });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            time: result.rows[0].now,
            message: "Database connection working!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Database connection failed'
        });
    }
});

// Get all users
app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all theses
app.get("/api/theses", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.id,
                t.title,
                t.description,
                t.status,
                t.created_at,
                u.name as supervisor_name,
                u.email as supervisor_email
            FROM theses t
            LEFT JOIN users u ON t.supervisor_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching theses:', error);
        res.status(500).json({ error: 'Failed to fetch theses' });
    }
});

// Create a new thesis
app.post("/api/theses", async (req, res) => {
    try {
        const { title, description, supervisor_id } = req.body;

        const result = await pool.query(
            `INSERT INTO theses (title, description, supervisor_id, status)
             VALUES ($1, $2, $3, 'available')
             RETURNING *`,
            [title, description, supervisor_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating thesis:', error);
        res.status(500).json({ error: 'Failed to create thesis' });
    }
});

export default app;