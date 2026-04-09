const express = require('express');
const session = require('express-session');
const path = require('path');
const authController = require('./controller/authController');
const cameraController = require('./controller/cameraController');
const { registerPgRealtimeRoutes } = require('./service/pgRealtime');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction
  }
}));
app.use(authController.attachCsrfToken);

// Routes
// 1. Auth & Main
app.get('/', authController.showMain);
app.get('/main', authController.showMain);

app.get('/signin', authController.showSignIn);
app.get('/signup', authController.showSignUp);

app.post('/login', authController.requireCsrf, authController.login);
app.post('/register', authController.requireCsrf, authController.register);
app.post('/login/google', authController.requireCsrf, authController.loginGoogle);
app.post('/logout', authController.requireAuth, authController.requireCsrf, authController.logout);

// 2. Camera Browsing & Booking
app.get('/browse', cameraController.browseCameras);
app.post('/book', authController.requireAuth, authController.requireCsrf, cameraController.bookCamera);
app.get('/booking/:bookingId/confirm', authController.requireAuth, cameraController.showBookingConfirm);
app.post('/booking/:bookingId/confirm', authController.requireAuth, authController.requireCsrf, cameraController.confirmBooking);
app.get('/booking/:bookingId/payment', authController.requireAuth, cameraController.showPaymentPage);
app.post('/booking/:bookingId/payment/confirm', authController.requireAuth, authController.requireCsrf, cameraController.confirmPayment);

// Admin dashboard 
app.get('/admin', authController.requireAdmin, cameraController.showAdminDashboard);

// Optional PostgreSQL SQL/report endpoints for pgAdmin class demo.
// Disabled by default (ENABLE_PG_REALTIME=false or unset).
registerPgRealtimeRoutes(app);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
