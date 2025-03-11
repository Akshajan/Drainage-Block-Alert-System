const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');


const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route to handle form submission

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


app.use(cors({
    origin: 'http://localhost:5500', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
}));

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

