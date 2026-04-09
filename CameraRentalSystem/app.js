const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const authController = require('./controller/authController');
const cameraController = require('./controller/cameraController');
const mediaController = require('./controller/mediaController');
const { registerPgRealtimeRoutes } = require('./service/pgRealtime');
const { ensureUploadDirectories, uploadImage } = require('./service/uploadService');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const forceSecureCookie = process.env.SESSION_COOKIE_SECURE === 'true';
const useSecureCookie = forceSecureCookie;

if (isProduction && (!sessionSecret || sessionSecret === 'change-this-session-secret')) {
  throw new Error('SESSION_SECRET must be set to a strong value in production');
}

if (forceSecureCookie) {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
ensureUploadDirectories();
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: sessionSecret || 'change-this-session-secret',
  store: new MemoryStore({
    checkPeriod: 1000 * 60 * 60
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: useSecureCookie,
    maxAge: 1000 * 60 * 60 * 4
  }
}));
app.use(authController.attachCsrfToken);

// Routes
// 1. Auth & Main
app.get('/', authController.showMain);
app.get('/main', authController.showMain);

app.get('/signin', authController.showSignIn);
app.get('/signup', authController.showSignUp);
app.get('/profile', authController.requireAuth, authController.showProfile);
app.post(
  '/profile/avatar',
  authController.requireAuth,
  uploadImage.single('avatarFile'),
  authController.requireCsrf,
  authController.updateProfileAvatar
);

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
app.get('/admin/media', authController.requireAdmin, mediaController.showMediaManager);
app.post(
  '/admin/media/upload',
  authController.requireAdmin,
  uploadImage.single('imageFile'),
  authController.requireCsrf,
  mediaController.uploadMedia
);

// Optional PostgreSQL SQL/report endpoints for pgAdmin class demo.
// Disabled by default (ENABLE_PG_REALTIME=false or unset).
registerPgRealtimeRoutes(app, authController.requireAdmin);

const port = Number(process.env.PORT || 3000);
if (require.main === module) {
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

module.exports = app;
