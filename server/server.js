require('dotenv').config();
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
    const supabase = await getSupabaseAdmin();

    // Check duplicate username in profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingProfile) {
      return res.status(400).json({ ok: false, message: 'Username already taken' });
    }

    // Create real Supabase Auth user so auth.users has the ID (required by FK on profile_cards)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: `${firstName || username} ${lastName || ''}`.trim() }
    });

    if (authError) {
      console.error('Supabase auth.admin.createUser error:', authError.message);
      return res.status(400).json({ ok: false, message: authError.message });
    }

    const supabaseId = authData.user.id;
    const token = Math.random().toString(36).slice(2);

    const newUser = {
      id: supabaseId,
      username,
      email,
      password,
      firstName: firstName || null,
      lastName: lastName || null,
      birthDate: birthDate || null,
      role: 'user',
      token,
      createdAt: new Date().toISOString()
    };

    // Save to local DB
    // Clean up orphaned local entry first
    const orphanedIdx = db.users.findIndex(u => u.username === username || u.email === email);
    if (orphanedIdx !== -1) db.users.splice(orphanedIdx, 1);
    db.users.push(newUser);
    await writeDb(db);

    // Save to Supabase profiles table using real auth user ID
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: supabaseId,
        username,
        email,
        full_name: `${firstName || username} ${lastName || ''}`.trim(),
        role: 'user',
        created_at: new Date().toISOString()
      }]);

    if (profileError) {
      console.warn('Supabase profiles insert warning:', profileError.message);
    }

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
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user (checks local DB and Supabase)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier: { type: string, description: 'Username or email' }
 *               password: { type: string }
 */
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ ok: false, message: 'Missing credentials' });
  }

  try {
    const supabase = await getSupabaseAdmin();

    // Query Supabase profiles table directly (Main source of truth)
    let { data: profileData, error: supabaseError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', identifier)
      .maybeSingle();

    if (!profileData) {
      const { data: emailData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', identifier)
        .maybeSingle();
      profileData = emailData;
    }

    if (!profileData) {
      // Fallback to local DB only if Supabase lookup fails or as a secondary check
      const db = await readDb();
      const localUser = db.users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
      
      if (localUser) {
        const { password: _, ...userWithoutPassword } = localUser;
        return res.status(200).json({ ok: true, user: userWithoutPassword });
      }
      
      return res.status(401).json({ ok: false, message: 'ไม่พบ Username หรือ Email นี้ในระบบ' });
    }

    if (profileData.password !== password) {
      return res.status(401).json({ ok: false, message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // Sync to local DB if missing (Self-healing)
    const db = await readDb();
    if (!db.users.find(u => u.username === profileData.username)) {
      db.users.push({
        ...profileData,
        firstName: profileData.full_name?.split(' ')[0] || profileData.username,
        lastName: profileData.full_name?.split(' ')[1] || '-',
      });
      await writeDb(db);
    }

    // Success - return user without password
    const { password: _, ...userWithoutPassword } = profileData;
    res.status(200).json({ ok: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ ok: false, message: 'Server error: ' + error.message });
  }
});

/**
 * @swagger
 * /api/admin/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Admin resets user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, newPassword]
 *             properties:
 *               username: { type: string, description: 'Username to reset' }
 *               newPassword: { type: string }
 */
app.post('/api/admin/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ ok: false, message: 'Missing fields' });
  }

  try {
    const supabase = await getSupabaseAdmin();

    // 1. Update in local DB if exists
    const db = await readDb();
    const localUserIdx = db.users.findIndex(u => u.username === username);
    if (localUserIdx !== -1) {
      db.users[localUserIdx].password = newPassword;
      await writeDb(db);
    }

    // 2. Update in Supabase profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ password: newPassword })
      .eq('username', username);

    if (error) {
      // If not in local AND failed in Supabase
      if (localUserIdx === -1) {
        return res.status(400).json({ ok: false, message: 'User not found: ' + error.message });
      }
      console.warn('Supabase password reset warning:', error.message);
    }

    res.status(200).json({ ok: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ ok: false, message: 'Server error: ' + error.message });
  }
});

/**
 * @swagger
 * /api/admin/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Admin changes their own password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, currentPassword, newPassword]
 *             properties:
 *               username: { type: string }
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 */
app.post('/api/admin/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ ok: false, message: 'Missing fields' });
  }

  try {
    const supabase = await getSupabaseAdmin();

    // 1. Update locally if exists
    const db = await readDb();
    const localUserIdx = db.users.findIndex(u => u.username === username && u.password === currentPassword);
    if (localUserIdx !== -1) {
      db.users[localUserIdx].password = newPassword;
      await writeDb(db);
    }

    // 2. Check and update in Supabase
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!profileData && localUserIdx === -1) {
      return res.status(401).json({ ok: false, message: 'User not found' });
    }

    if (profileData) {
      if (profileData.password !== currentPassword) {
        return res.status(401).json({ ok: false, message: 'Current password is incorrect' });
      }

      const { error } = await supabase
        .from('profiles')
        .update({ password: newPassword })
        .eq('username', username);

      if (error) {
        console.warn('Supabase password change warning:', error.message);
      }
    }

    res.status(200).json({ ok: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ ok: false, message: 'Server error: ' + error.message });
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
    const supabase = await getSupabaseAdmin();
    const { data: supabaseUsers, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Users Supabase Error:', error);
      // Fallback to local DB if Supabase fails
      const db = await readDb();
      const users = db.users.map(({ password, ...user }) => user);
      return res.status(200).json(users);
    }

    // Map Supabase fields to match frontend expectations if necessary
    const users = (supabaseUsers || []).map(({ password, full_name, ...user }) => ({
      ...user,
      firstName: full_name?.split(' ')[0] || user.username,
      lastName: full_name?.split(' ')[1] || '-',
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.get('/api/users/by-username/:username', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, role')
      .eq('username', req.params.username)
      .maybeSingle();
    
    if (error) return res.status(500).json({ ok: false, message: error.message });
    if (!data) return res.status(404).json({ ok: false, message: 'User not found' });
    
    res.json({ ok: true, user: data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
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
  const { username } = req.params;
  const updates = req.body;
  console.log(`Updating user ${username}:`, updates);
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ ok: false, message: 'No fields to update' });
  }

  try {
    const db = await readDb();
    const userIndex = db.users.findIndex(u => u.username === username);
    const supabase = await getSupabaseAdmin();
    
    // Check if renaming username
    const newUsername = updates.username;
    if (newUsername && newUsername !== username) {
      // 1. Check if new username is taken locally
      if (db.users.find(u => u.username === newUsername)) {
        return res.status(400).json({ ok: false, message: 'Username already taken' });
      }
      
      // 2. Check if new username is taken in Supabase
      const { data: existingSupabase } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUsername)
        .maybeSingle();
      
      if (existingSupabase) {
        return res.status(400).json({ ok: false, message: 'Username already taken in Supabase' });
      }

      // 3. Update professional_profiles table in Supabase first (to prevent orphans)
      const { error: profError } = await supabase
        .from('professional_profiles')
        .update({ username: newUsername })
        .eq('username', username);
      
      if (profError) {
        console.warn('Professional profiles sync warning:', profError.message);
      }
    }

    // 1. Update locally
    if (userIndex !== -1) {
      db.users[userIndex] = { ...db.users[userIndex] };
      for (const key in updates) {
        if (updates[key] !== undefined && key !== 'id') {
          db.users[userIndex][key] = updates[key];
        }
      }
      await writeDb(db);
    }

    // 2. Update in Supabase profiles table
    const mapped = {};
    if (updates.username) mapped.username = updates.username;
    if (updates.role) mapped.role = updates.role;
    if (updates.email) mapped.email = updates.email;
    
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const existingUser = db.users[userIndex] || {};
      const fName = updates.firstName !== undefined ? updates.firstName : (existingUser.firstName || '');
      const lName = updates.lastName !== undefined ? updates.lastName : (existingUser.lastName || '');
      mapped.full_name = `${fName} ${lName}`.trim();
    }
    
    if (Object.keys(mapped).length > 0) {
      const { data: profileToUpdate } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      const { error: supabaseError } = await supabase
        .from('profiles')
        .update(mapped)
        .eq('username', username);
      
      if (supabaseError) {
        console.warn('Supabase update warning:', supabaseError.message);
      }

      // Sync email to Supabase Auth if it changed and we have the profile ID
      if (updates.email && profileToUpdate?.id) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          profileToUpdate.id,
          { email: updates.email, email_confirm: true }
        );
        if (authError) {
          console.warn('Supabase Auth sync warning:', authError.message);
        }
      }
    }

    if (userIndex === -1) {
      return res.status(200).json({ ok: true, message: 'User updated in Supabase' });
    }
    
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
    
    if (db.users.length !== initialLength) {
      await writeDb(db);
    }
    
    // 2. Delete from Supabase
    const supabase = await getSupabaseAdmin();
    const { error: supabaseError } = await supabase
      .from('profiles')
      .delete()
      .eq('username', username);

    if (supabaseError) {
      console.warn('Supabase delete warning:', supabaseError.message);
    }

    if (db.users.length === initialLength && supabaseError) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    res.status(200).json({ ok: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// ─── Professional Profiles API ─────────────────────────────────────────────────

const getSupabaseAdmin = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || 'https://aonkndmgaqloeqmibeeh.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

app.get('/api/admin/profile-cards', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data: cards, error: cardsError } = await supabase
      .from('profile_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (cardsError) return res.status(500).json({ ok: false, message: cardsError.message });

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username');
    
    if (profilesError) return res.status(500).json({ ok: false, message: profilesError.message });

    // Manual join
    const enrichedCards = cards.map(card => ({
      ...card,
      profiles: profiles.find(p => p.id === card.user_id) || { username: 'Unknown' }
    }));

    res.json({ ok: true, data: enrichedCards });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reportsError) return res.status(500).json({ ok: false, message: reportsError.message });

    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username');
    const { data: cards, error: cardsError } = await supabase.from('profile_cards').select('id, user_id, profiles(username)');

    const enrichedReports = reports.map(report => {
      // Find reporter username from profiles
      const reporter = profiles?.find(p => p.id === report.reporter_id);
      
      // Find target username from profile_cards -> profiles join
      const targetCard = cards?.find(c => c.id === report.profile_id);
      const targetUser = targetCard?.profiles?.username || 'Unknown';

      return {
        ...report,
        reporter: reporter?.username || 'Anonymous',
        targetUser: targetUser,
        createdAt: report.created_at // for frontend camelCase compatibility
      };
    });

    res.json({ ok: true, data: enrichedReports });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { profile_id, reporter_id, reason, details } = req.body;
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('reports')
      .insert({
        profile_id,
        reporter_id: reporter_id || null,
        reason,
        details,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.delete('/api/admin/reports/:id', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', req.params.id);
    
    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.delete('/api/admin/profiles/:id', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('profile_cards')
      .delete()
      .eq('id', req.params.id);
    
    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/profiles — get all profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    // Fetch both to filter orphaned profiles
    const { data: users } = await supabase.from('profiles').select('username');
    const userList = (users || []).map(u => u.username);

    const { data, error } = await supabase
      .from('professional_profiles')
      .select('*')
      .in('username', userList)
      .order('created_at', { ascending: true });
    
    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/profiles/by-username/:username
app.get('/api/profiles/by-username/:username', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('username', req.params.username)
      .maybeSingle();
    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/profiles/by-id/:id
app.get('/api/profiles/by-id/:id', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/profiles — create or get professional profile
app.post('/api/profiles', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { username, user_id } = req.body;
    if (!username) return res.status(400).json({ ok: false, message: 'username required' });

    // Return existing if found
    const { data: existing } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (existing) return res.json({ ok: true, data: existing });

    // Generate a UUID for user_id (Supabase requires UUID type)
    const { randomUUID } = await import('crypto');
    const newProfile = {
      user_id: randomUUID(),
      username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data: {
        displayName: username,
        jobTitle: '',
        location: '',
        avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
        coverImage: '',
        coverColor: '#0a66c2',
        about: '',
        experienceYears: 0,
        skills: [],
        experience: [],
        education: [],
        tagline: '',
        followers: 0,
        vheartLikes: 0,
        following: 0,
        contact: { email: '', phone: '', address: '', links: [] },
        featuredItems: [],
        recentActivity: [],
        isPublic: true
      }
    };

    const { data, error } = await supabase
      .from('professional_profiles')
      .insert(newProfile)
      .select()
      .single();
    if (error) return res.status(500).json({ ok: false, message: error.message });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PATCH /api/profiles/by-id/:id — update profile
app.patch('/api/profiles/by-id/:id', async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data: current, error: fetchErr } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (fetchErr || !current) return res.status(404).json({ ok: false, message: 'Profile not found' });

    const updates = req.body.data || req.body;
    const updatedData = { ...current.data, ...updates };
    
    const { data, error } = await supabase
      .from('professional_profiles')
      .update({
        data: updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, message: error.message });

    // Sync displayName back to profiles table if changed
    if (updates.displayName && current.username) {
      try {
        const fullName = updates.displayName;
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('username', current.username);

        // Also update local db.json
        const dbRaw = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(dbRaw);
        const userIndex = db.users.findIndex(u => u.username === current.username);
        if (userIndex !== -1) {
          db.users[userIndex].fullName = fullName;
          db.users[userIndex].firstName = fullName;
          db.users[userIndex].lastName = '';
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }
      } catch (syncErr) {
        console.error('Failed to sync displayName to profiles:', syncErr);
      }
    }

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (Using Local JSON Database)`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
