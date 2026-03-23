const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection Setup
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'jwt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Persona API',
      version: '1.0.0',
      description: 'API documentation for Smart Persona Backend',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./server.js'], // specify the path to API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Username or email already taken or missing credentials
 *       500:
 *         description: Internal server error
 */
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, firstName, lastName, birthDate } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ ok: false, message: 'Username, email and password are required' });
  }

  try {
    // Note: To use email/firstName/lastName/birthDate fully, ensure your 'users' table has these columns.
    // If not, it will only insert what is defined in the initial jwt.sql script.
    // This script tries to support the frontend requirements based on existing mock logic.
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ ok: false, message: 'Username already taken' });
    }

    // Attempt to ensure role 1 exists
    await pool.query('INSERT IGNORE INTO roles (id, name) VALUES (1, "user")');

    const role_id = 1;
    const token = Math.random().toString(36).slice(2);

    // Note: Since jwt.sql is updated, we can insert all fields now
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, firstName, lastName, birthDate, token, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, email, password, firstName || null, lastName || null, birthDate || null, token, role_id]
    );

    const newUser = { id: result.insertId, username, role_id, token, email, firstName, lastName, birthDate };
    res.status(201).json({ ok: true, user: newUser });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ ok: false, message: 'Server error during registration' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or Email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ ok: false, message: 'Missing credentials' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [identifier, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Invalid username/email or password' });
    }

    res.status(200).json({ ok: true, user: rows[0] });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *       500:
 *         description: Internal server error
 */
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/users/{username}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.put('/api/users/:username', async (req, res) => {
  const username = req.params.username;
  const updates = req.body;
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ ok: false, message: 'No fields to update' });
  }

  try {
    const [existing] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Construct dynamic update query (assuming columns match updates keys)
    const validUpdates = {};
    for (const key in updates) {
       if (updates[key] !== undefined && key !== 'id' && key !== 'username') validUpdates[key] = updates[key];
    }
    
    if (Object.keys(validUpdates).length === 0) {
      return res.status(200).json({ ok: true, user: existing[0] });
    }

    const setClauses = [];
    const values = [];
    for (const [key, value] of Object.entries(validUpdates)) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
    values.push(username);

    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE username = ?`;
    await pool.execute(query, values);

    const [updated] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    res.status(200).json({ ok: true, user: updated[0] });

  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ ok: false, message: 'Server error or invalid column names' });
  }
});

/**
 * @swagger
 * /api/users/{username}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
app.delete('/api/users/:username', async (req, res) => {
  const username = req.params.username;
  
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE username = ?', [username]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }
    
    res.status(200).json({ ok: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
