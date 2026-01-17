import pool from './db.js';

/**
 * This function creates all the database tables
 * It runs SQL commands to set up your schema
 */
export const initializeDatabase = async () => {
    try {
        console.log('🔄 Initializing database tables...');

        // Step 1: Create Users table
        // This stores all users (students and supervisors)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Users table created');

        // Step 2: Create Theses table
        // This stores all thesis topics
        await pool.query(`
            CREATE TABLE IF NOT EXISTS theses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                supervisor_id INTEGER REFERENCES users(id),
                status VARCHAR(50) DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Theses table created');

        // Step 3: Create Assignments table
        // This links students to theses
        await pool.query(`
            CREATE TABLE IF NOT EXISTS thesis_assignments (
                id SERIAL PRIMARY KEY,
                thesis_id INTEGER REFERENCES theses(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(thesis_id, student_id)
            );
        `);
        console.log('✓ Thesis assignments table created');

        // Step 4: Insert sample data (OPTIONAL - for testing)
        // You can remove this in production
        await insertSampleData();

        console.log('✅ Database initialization complete!');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
};

/**
 * Insert some sample data for testing
 */
const insertSampleData = async () => {
    try {
        // Insert sample users
        const usersResult = await pool.query(`
            INSERT INTO users (email, name, role) VALUES
            ('supervisor1@university.edu', 'Dr. John Smith', 'supervisor'),
            ('supervisor2@university.edu', 'Dr. Sarah Johnson', 'supervisor'),
            ('student1@university.edu', 'Alice Brown', 'student'),
            ('student2@university.edu', 'Bob Wilson', 'student')
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        `);

        if (usersResult.rowCount && usersResult.rowCount > 0) {
            console.log(`✓ Inserted ${usersResult.rowCount} sample users`);
        }

        // Insert sample theses
        const thesesResult = await pool.query(`
            INSERT INTO theses (title, description, supervisor_id, status)
            SELECT
                'Machine Learning in Healthcare',
                'Research on ML applications in medical diagnosis',
                id,
                'available'
            FROM users WHERE email = 'supervisor1@university.edu'
            UNION ALL
            SELECT
                'Blockchain Security',
                'Analysis of security protocols in blockchain systems',
                id,
                'available'
            FROM users WHERE email = 'supervisor1@university.edu'
            UNION ALL
            SELECT
                'Web Performance Optimization',
                'Techniques for improving web application performance',
                id,
                'assigned'
            FROM users WHERE email = 'supervisor2@university.edu'
            ON CONFLICT DO NOTHING
            RETURNING id;
        `);

        if (thesesResult.rowCount && thesesResult.rowCount > 0) {
            console.log(`✓ Inserted ${thesesResult.rowCount} sample theses`);
        }
    } catch (error) {
        console.log('ℹ️  Sample data already exists or skipped');
    }
};
