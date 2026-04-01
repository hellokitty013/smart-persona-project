const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'db.json');

// Helper to read DB
const readDb = async () => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const initialData = { users: [] };
      await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    throw error;
  }
};

// Helper to write DB
const writeDb = async (data) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

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
    const db = await readDb();
    
    // Check if user exists
    const existingUser = db.users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'Username or email already taken' });
    }

    const token = Math.random().toString(36).slice(2);
    const newUser = {
      id: Date.now(),
      username,
      email,
      password,
      firstName: firstName || null,
      lastName: lastName || null,
      birthDate: birthDate || null,
      role: 'user', // Default role for local JSON
      token,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    await writeDb(db);

    // Don't send password back in response
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ ok: true, user: userWithoutPassword });
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
    const db = await readDb();
    const user = db.users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid username/email or password' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ ok: true, user: userWithoutPassword });
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
    const db = await readDb();
    // Exclude passwords
    const users = db.users.map(({ password, ...user }) => user);
    res.status(200).json(users);
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
    const db = await readDb();
    const userIndex = db.users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Apply updates (exclude id and username)
    db.users[userIndex] = { ...db.users[userIndex] };
    for (const key in updates) {
      if (updates[key] !== undefined && key !== 'id' && key !== 'username') {
        db.users[userIndex][key] = updates[key];
      }
    }

    await writeDb(db);
    
    const { password: _, ...userWithoutPassword } = db.users[userIndex];
    res.status(200).json({ ok: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
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
    const db = await readDb();
    const initialLength = db.users.length;
    db.users = db.users.filter(u => u.username !== username);
    
    if (db.users.length === initialLength) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }
    
    await writeDb(db);
    res.status(200).json({ ok: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (Using Local JSON Database)`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
