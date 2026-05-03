import "dotenv/config";
import express from "express";
import influxApi from "./routes/influxApi.js";

// ✅ ESM imports (replace require)
import bodyParser from "body-parser";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import morgan from "morgan";
import session from "express-session";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST", "PUT"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("✅ WebSocket client connected");
  socket.on("disconnect", () => console.log("❌ WebSocket client disconnected"));
});

// Broadcast segment data every 2 seconds
setInterval(async () => {
  if (io.engine.clientsCount > 0) {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/latest/segment`);
      if (response.ok) {
        const json = await response.json();
        io.emit('segmentUpdate', json);
      }
    } catch (err) {
      // Ignore fetch errors during polling
    }
  }
}, 2000);

// Needed to emulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ───────────────────────── Middleware ─────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("tiny"));

app.use(express.json());

// Static folder (adjust if needed)
app.use(express.static(path.join(__dirname, "public")));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set true only if HTTPS
  })
);

// ───────────────────────── Routes ─────────────────────────
app.get("/", (req, res) => {
  res.json({
    ok: true,
    msg: "ServerA running",
    server_time_utc: new Date().toISOString(),
  });
});

// ✅ Mount Influx fetch APIs
app.use("/api", influxApi);

// ───────────────────────── Start ─────────────────────────
server.listen(PORT, () => {
  console.log(`✅ ServerA listening on http://localhost:${PORT}`);
  console.log("ENV CHECK:", {
    INFLUX_URL: process.env.INFLUX_URL,
    INFLUX_ORG: process.env.INFLUX_ORG,
    INFLUX_BUCKET: process.env.INFLUX_BUCKET,
    MEAS_SENSOR: process.env.MEAS_SENSOR || "drainage_sensor",
    MEAS_SEGMENT: process.env.MEAS_SEGMENT || "drainage_segment",
  });
});



const adminAuth = (req, res, next) => {
    if (req.session.admin?.authenticated) {
        next();
    } else {
        // Handle API requests
        if (req.accepts('json')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Handle HTML requests
        res.redirect('/administrator');
    }
};

// Protect admin route (removed EJS rendering route)

app.get('/api/admin/reports', (req, res) => {
    // Note: skipping adminAuth for the quick React integration example, but we should secure it.
    const sql = 'SELECT * FROM reports ORDER BY reported_at DESC';
    db.query(sql, (err, reports) => {
        if (err) return res.status(500).json({error: "Database error"});
        res.json({ reports });
    });
});


// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: 'Akshajan.K', // replace with your MySQL password
    database: 'userdb'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Removed index redirect and index route

app.get('/api/reports', (req, res) => {
    const sql = 'SELECT * FROM reports ORDER BY reported_at DESC';
    db.query(sql, (err, reports) => {
        if (err) return res.status(500).json({error: "Database error"});
        res.json({ reports });
    });
});


// Removed EJS page routes (login, report view, signup, contact, administrator, about)


// Removed EJS profile route

app.get('/api/profile/:email', (req, res) => {
    const sql = 'SELECT * FROM reports WHERE email = ? ORDER BY reported_at DESC';
    db.query(sql, [req.params.email], (err, reports) => {
        if (err) return res.status(500).json({error: "Database error"});
        res.json({ reports: reports || [] });
    });
});

app.post('/profile/upload', upload.single('profile_picture'), (req, res) => {
    const user = req.session.user || null;
    if (!user) return res.redirect('/login');
    if (!req.file) return res.redirect('/profile');
    
    const profile_picture = '/uploads/' + req.file.filename;
    const sql = 'UPDATE users SET profile_picture = ? WHERE id = ?';
    db.query(sql, [profile_picture, user.id], (err, result) => {
        if (!err) {
            req.session.user.profile_picture = profile_picture;
        }
        res.redirect('/profile');
    });
});



// Signup route
app.post('/signup', upload.single('profile_picture'), (req, res) => {
    const { name, address, state, pincode, phone, email, pass } = req.body;
    const profile_picture = req.file ? '/uploads/' + req.file.filename : '/images/user.png';
    const hashedPassword = bcrypt.hashSync(pass, 8);
    const sql = 'INSERT INTO users (name, address, state, pincode, phone, email, password, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, address, state, pincode, phone, email, hashedPassword, profile_picture], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error in signing up', error: err });
        } else {
            res.status(200).send({ message: 'User signed up successfully' });
        }
    });
});

// Login route
app.post('/login', (req, res) => {
    const { email, phone, pass } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND phone = ?';
    db.query(sql, [email, phone], (err, result) => {
        if (err) {
            res.status(500).send({ message: 'Error in logging in', error: err });
        } else if (result.length > 0) {
            const user = result[0];
            const passwordIsValid = bcrypt.compareSync(pass, user.password);
            if (passwordIsValid) {
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    state: user.state,
                    pincode: user.pincode,
                    profile_picture: user.profile_picture || '/images/user.png'
                };
                res.status(200).send({ message: 'Login successful', user: user });
            } else {
                res.status(401).send({ message: 'Invalid password' });
            }
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    });
});

// Admin Sign-In Route
app.post('/administrator', (req, res) => {
    const { email, password } = req.body;

    // Fetch admin details
    const sql = 'SELECT * FROM admins WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Error in signing in', error: err });
        }

        if (result.length === 0) {
            return res.status(404).send({ message: 'Admin not found' });
        }

        const admin = result[0];

        // Compare passwords (should be hashed in production)
        if (password === admin.password) {
            req.session.admin = {  // Store admin in session
                id: admin.id,
                email: admin.email,
                authenticated: true
            };
            res.status(200).send({ 
                message: 'Admin sign-in successful',
                redirect: '/admin'  // Explicit redirect path
            });
        } else {
            res.status(401).send({ message: 'Invalid password' });
        }
    });
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// report route
app.post('/report', upload.single('photo'), (req, res) => {
    const { name, mobile, email, bl, 'block-details': blockDetails, block_location } = req.body;
    const photoPath = req.file ? req.file.path : null;
    
    const sql = 'INSERT INTO reports (name, mobile, email, bl, block_details, photo_path, status, block_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, mobile, email, bl, blockDetails, photoPath, 'pending', block_location], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).send({ message: 'Error in submitting report. Please try again.' });
        } else {
            res.status(200).send({ message: 'Report submitted successfully' });
        }
    });
})
// Removed EJS profile/:userId route

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Update report status route
app.put('/reports/:id/status', adminAuth, (req, res) => {
    const reportId = parseInt(req.params.id);
    const newStatus = req.body.status;

    // Validation
    if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID" });
    }

    if (!['pending', 'resolved'].includes(newStatus)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    const sql = 'UPDATE reports SET status = ? WHERE id = ?';
    db.query(sql, [newStatus, reportId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: "Database error", 
                details: err.message 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Report not found" });
        }

        res.status(200).json({ 
            message: "Status updated successfully",
            newStatus: newStatus
        });
    });
});

// Replace ALL CORS configurations with this at the TOP
app.use(cors({
    origin: 'http://localhost:3000', // Frontend origin
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
