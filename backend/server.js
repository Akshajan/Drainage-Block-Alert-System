const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
var morgan = require('morgan');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("tiny"))
app.use(express.static("public"));
app.set("view engine", "ejs");

const session = require('express-session');


// Add after other middleware declarations
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Admin authentication middleware
const adminAuth = (req, res, next) => {
    if (req.session.admin && req.session.admin.authenticated) {
        next();
    } else {
        res.redirect('/administrator');
    }
};

// Protect admin route
app.get('/admin', adminAuth, (req, res) => {
    // Fetch reports from database
    const sql = 'SELECT * FROM reports ORDER BY reported_at DESC';
    db.query(sql, (err, reports) => {
        if (err) {
            console.error('Database error:', err);
            res.render('admin', { reports: [] });
        } else {
            res.render('admin', { reports });
        }
    });

});


// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: 'root', // replace with your MySQL password
    database: 'userdb'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});


// Update your index route to render EJS
app.get('/',(req,res)=> {
    res.redirect('/index');
});

app.get('/index', (req, res) => {
    const sql = 'SELECT * FROM reports';
    db.query(sql, (err, reports) => {
        if (err) {
            console.error('Database error:', err);
            res.render('index', { reports: [] });
        } else {
            res.render('index', { reports });
        }
    });
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/report', (req, res) => {
    // Query all reports, ordering by report time (most recent first)
    const sql = 'SELECT * FROM reports ';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching reports:', err);
        return res.status(500).send('Internal Server Error');
      }
      // Pass the reports data to the EJS template
      res.render('report', { reports: results });
    });
  })

app.get('/signup', (req, res) => {
    res.render("signup");
});

app.get('/contact', (req, res) => {
    res.render("contact");
});

app.get('/administrator', (req, res) => {
    res.render("administrator");
});

app.get('/about', (req, res) => {
    res.render("about");
});


app.get('/profile', (req, res) => {
    // Create a dummy user object since there's no login yet
    const user = {
        name: "Demo User",
        email: "demo@example.com",
        phone: "1234567890"
    };
    // Render profile with dummy user data
    res.render("profile", { user: user, reports: [] });
});



// Signup route
app.post('/signup', (req, res) => {
    
    const { name, address, state, pincode, phone, email, pass } = req.body;
    const hashedPassword = bcrypt.hashSync(pass, 8);
    const sql = 'INSERT INTO users (name, address, state, pincode, phone, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, address, state, pincode, phone, email, hashedPassword], (err, result) => {
        if (err) {
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

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Report route
app.post('/report', upload.single('photo'), (req, res) => {
    console.log('Request Body:', req.body); // Log the request body
    console.log('Uploaded File:', req.file); // Log the uploaded file

    const { name, mobile, email, address, 'block-details': blockDetails } = req.body; // Match the frontend field name
    const photoPath = req.file ? req.file.path : null; // Path to the uploaded photo

    const sql = 'INSERT INTO reports (name, mobile, email, address, block_details, photo_path) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, mobile, email, address, blockDetails, photoPath], (err, result) => {
        if (err) {
            console.error('Database error:', err); // Log the error for debugging
            res.status(500).send({ message: 'Error in submitting report. Please try again.' });
        } else {
            res.status(200).send({ message: 'Report submitted successfully' });
        }
    });
});

// Profile route
app.get('/profile/:userId', (req, res) => {
    const userId = req.params.userId;

    // Fetch user details
    const userSql = 'SELECT name, email, phone FROM users WHERE id = ?';
    db.query(userSql, [userId], (err, userResult) => {
        if (err) {
            return res.status(500).send({ message: 'Error fetching user details', error: err });
        }

        if (userResult.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const user = userResult[0];

        // Fetch reported drainage blocks
        const reportsSql = 'SELECT * FROM reports WHERE email = ? ORDER BY reported_at DESC';
        db.query(reportsSql, [user.email], (err, reportsResult) => {
            if (err) {
                return res.status(500).send({ message: 'Error fetching reports', error: err });
            }

            res.render('profile', { user, reports: reportsResult });
        });
    });
});


app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/administrator');
});


app.use(cors({
    origin: 'http://localhost:5500', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
}));

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
