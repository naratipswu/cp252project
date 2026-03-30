const express = require('express');
const session = require('express-session');
const path = require('path');
const authController = require('./controller/authController');
const cameraController = require('./controller/cameraController');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'camera-rental-secret',
  resave: false,
  saveUninitialized: true
}));

// Routes
// 1. Auth & Main
app.get('/', authController.showMain);
app.get('/main', authController.showMain);

app.get('/signin', authController.showSignIn);
app.get('/signup', authController.showSignUp);

app.post('/login', authController.loginAdmin);
app.post('/login/google', authController.loginGoogle);
app.get('/logout', authController.logout);

// 2. Camera Browsing & Booking
app.get('/browse', cameraController.browseCameras);
app.post('/book', authController.requireAuth, cameraController.bookCamera);

// Admin dashboard 
app.get('/admin', authController.requireAdmin, cameraController.showAdminDashboard);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
