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
      description: 'API documentation for Smart Persona — combines Local JSON API (port 5000) and Supabase REST API.\n\n**Supabase Base URL:** `https://aonkndmgaqloeqmibeeh.supabase.co/rest/v1`\n\nSupabase endpoints require header: `apikey: <ANON_KEY>` and `Authorization: Bearer <JWT>`',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local JSON API (Express)',
      },
      {
        url: 'https://aonkndmgaqloeqmibeeh.supabase.co/rest/v1',
        description: 'Supabase REST API',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Local authentication (JSON DB)' },
      { name: 'Users', description: 'Local user management (JSON DB)' },
      { name: 'Supabase - Auth', description: 'Supabase authentication (via Supabase SDK)' },
      { name: 'Supabase - Profile Cards', description: 'Personal/Vtree/Resume profile cards (table: profile_cards)' },
      { name: 'Supabase - Professional Profiles', description: 'LinkedIn-style professional profiles (table: professional_profiles)' },
      { name: 'Supabase - Reports', description: 'User report system (table: reports)' },
      { name: 'Supabase - Saved Profiles', description: 'Bookmarked profiles (table: saved_profiles)' },
    ],
    components: {
      securitySchemes: {
        SupabaseJWT: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token from login response',
        },
        SupabaseApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'apikey',
          description: 'Supabase anon public key',
        },
      },
      schemas: {
        ProfileCard: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'profile_1712345678' },
            user_id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['personal', 'vtree', 'resume'], example: 'personal' },
            name: { type: 'string', example: 'My Personal Profile' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            data: { type: 'object', description: 'Profile content (username, bio, links, theme tokens, etc.)' },
          },
        },
        ProfessionalProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            username: { type: 'string', example: 'john_doe' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            data: {
              type: 'object',
              properties: {
                displayName: { type: 'string' },
                jobTitle: { type: 'string' },
                location: { type: 'string' },
                avatar: { type: 'string' },
                about: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } },
                experience: { type: 'array', items: { type: 'object' } },
                education: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        Report: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reporter_id: { type: 'string', format: 'uuid' },
            reported_profile_id: { type: 'string' },
            reason: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'reviewed', 'resolved', 'dismissed'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        SavedProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            profile_id: { type: 'string' },
          },
        },
      },
    },
    paths: {
      // ── Supabase Auth ────────────────────────────────────────────────────────
      '/auth/v1/signup': {
        post: {
          tags: ['Supabase - Auth'],
          summary: 'Register a new user (Supabase Auth)',
          servers: [{ url: 'https://aonkndmgaqloeqmibeeh.supabase.co' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    data: {
                      type: 'object',
                      description: 'User metadata',
                      properties: {
                        username: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        birthDate: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'User registered successfully' },
            400: { description: 'Email already registered or invalid data' },
          },
        },
      },
      '/auth/v1/token': {
        post: {
          tags: ['Supabase - Auth'],
          summary: 'Login user (Supabase Auth)',
          servers: [{ url: 'https://aonkndmgaqloeqmibeeh.supabase.co' }],
          parameters: [
            { in: 'query', name: 'grant_type', required: true, schema: { type: 'string', enum: ['password'] } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful, returns JWT token' },
            400: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/v1/logout': {
        post: {
          tags: ['Supabase - Auth'],
          summary: 'Logout user (Supabase Auth)',
          servers: [{ url: 'https://aonkndmgaqloeqmibeeh.supabase.co' }],
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          responses: {
            204: { description: 'Logged out successfully' },
          },
        },
      },
      // ── Profile Cards ────────────────────────────────────────────────────────
      '/profile_cards': {
        get: {
          tags: ['Supabase - Profile Cards'],
          summary: 'Get all profile cards for current user',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'query', name: 'user_id', schema: { type: 'string' }, description: 'Filter by user_id (eq.{uuid})' },
            { in: 'query', name: 'order', schema: { type: 'string' }, description: 'e.g. created_at.asc' },
          ],
          responses: {
            200: {
              description: 'List of profile cards',
              content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/ProfileCard' } } } },
            },
          },
        },
        post: {
          tags: ['Supabase - Profile Cards'],
          summary: 'Create a new profile card',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ProfileCard' },
              },
            },
          },
          responses: {
            201: { description: 'Profile card created' },
            400: { description: 'Bad request' },
          },
        },
      },
      '/profile_cards/{id}': {
        get: {
          tags: ['Supabase - Profile Cards'],
          summary: 'Get profile card by ID',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Profile card data', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ProfileCard' } } } },
            404: { description: 'Not found' },
          },
        },
        patch: {
          tags: ['Supabase - Profile Cards'],
          summary: 'Update a profile card',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: {
            200: { description: 'Updated' },
            404: { description: 'Not found' },
          },
        },
        delete: {
          tags: ['Supabase - Profile Cards'],
          summary: 'Delete a profile card',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          ],
          responses: {
            204: { description: 'Deleted' },
            404: { description: 'Not found' },
          },
        },
      },
      // ── Professional Profiles ─────────────────────────────────────────────────
      '/professional_profiles': {
        get: {
          tags: ['Supabase - Professional Profiles'],
          summary: 'Get all professional profiles',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'query', name: 'user_id', schema: { type: 'string' }, description: 'Filter by user_id' },
            { in: 'query', name: 'username', schema: { type: 'string' }, description: 'Filter by username (eq.{username})' },
          ],
          responses: {
            200: {
              description: 'List of professional profiles',
              content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/ProfessionalProfile' } } } },
            },
          },
        },
        post: {
          tags: ['Supabase - Professional Profiles'],
          summary: 'Create a professional profile',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { '$ref': '#/components/schemas/ProfessionalProfile' } } },
          },
          responses: {
            201: { description: 'Created' },
          },
        },
      },
      '/professional_profiles/{id}': {
        get: {
          tags: ['Supabase - Professional Profiles'],
          summary: 'Get professional profile by ID',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Professional profile data', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ProfessionalProfile' } } } },
          },
        },
        patch: {
          tags: ['Supabase - Professional Profiles'],
          summary: 'Update a professional profile',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: {
            200: { description: 'Updated' },
          },
        },
        delete: {
          tags: ['Supabase - Professional Profiles'],
          summary: 'Delete a professional profile',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            204: { description: 'Deleted' },
          },
        },
      },
      // ── Reports ──────────────────────────────────────────────────────────────
      '/reports': {
        get: {
          tags: ['Supabase - Reports'],
          summary: 'Get all reports (admin)',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'query', name: 'order', schema: { type: 'string' }, description: 'e.g. created_at.desc' },
            { in: 'query', name: 'status', schema: { type: 'string' }, description: 'Filter by status (eq.pending)' },
          ],
          responses: {
            200: {
              description: 'List of reports',
              content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/Report' } } } },
            },
          },
        },
        post: {
          tags: ['Supabase - Reports'],
          summary: 'Submit a new report',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reported_profile_id', 'reason'],
                  properties: {
                    reported_profile_id: { type: 'string' },
                    reason: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Report submitted' },
          },
        },
      },
      '/reports/{id}': {
        patch: {
          tags: ['Supabase - Reports'],
          summary: 'Update report status (admin)',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['pending', 'reviewed', 'resolved', 'dismissed'] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Status updated' },
          },
        },
        delete: {
          tags: ['Supabase - Reports'],
          summary: 'Delete a report (admin)',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            204: { description: 'Deleted' },
          },
        },
      },
      // ── Saved Profiles ───────────────────────────────────────────────────────
      '/saved_profiles': {
        get: {
          tags: ['Supabase - Saved Profiles'],
          summary: 'Get saved profile IDs for current user',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'query', name: 'user_id', schema: { type: 'string' }, description: 'Filter by user_id (eq.{uuid})' },
            { in: 'query', name: 'select', schema: { type: 'string' }, description: 'e.g. profile_id' },
          ],
          responses: {
            200: {
              description: 'Saved profiles',
              content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/SavedProfile' } } } },
            },
          },
        },
        post: {
          tags: ['Supabase - Saved Profiles'],
          summary: 'Save a profile',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['profile_id'],
                  properties: {
                    user_id: { type: 'string', format: 'uuid' },
                    profile_id: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Profile saved' },
          },
        },
      },
      '/saved_profiles/{id}': {
        delete: {
          tags: ['Supabase - Saved Profiles'],
          summary: 'Unsave (remove) a saved profile',
          security: [{ SupabaseJWT: [], SupabaseApiKey: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            204: { description: 'Removed from saved' },
          },
        },
      },
    },
  },
  apis: ['./server.js'],
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
