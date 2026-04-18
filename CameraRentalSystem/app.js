const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const authController = require('./controller/authController');
const cameraController = require('./controller/cameraController');
const mediaController = require('./controller/mediaController');
const cartController = require('./controller/cartController');
const dashboardController = require('./controller/dashboardController');
const logController = require('./controller/logController');
const returnController = require('./controller/returnController');
const { registerPgRealtimeRoutes } = require('./service/pgRealtime');
const { ensureUploadDirectories, uploadImage } = require('./service/uploadService');
const { ensureCameraStoreReady } = require('./service/cameraStore');
const { ensureFullSchemaReady } = require('./service/schemaSync');
const { ensureAdminSeed } = require('./service/adminSeed');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
const forceSecureCookie = process.env.SESSION_COOKIE_SECURE === 'true';
const useSecureCookie = forceSecureCookie ? true : (isProduction ? 'auto' : false);

if (!sessionSecret || sessionSecret === 'change-this-session-secret') {
  throw new Error('SESSION_SECRET must be set to a strong value');
}
if (isProduction && process.env.ENABLE_MOCK_GOOGLE_LOGIN === 'true') {
  throw new Error('ENABLE_MOCK_GOOGLE_LOGIN must be disabled in production');
}

if (isProduction || forceSecureCookie) {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
ensureUploadDirectories();
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/brand_logo', express.static(path.join(__dirname, 'public', 'brand_logo')));
app.use('/categ_main', express.static(path.join(__dirname, 'public', 'categ_main')));
app.use('/process', express.static(path.join(__dirname, 'public', 'process')));
async function initializeApp() {
  await ensureFullSchemaReady();
  await ensureCameraStoreReady();
  await ensureAdminSeed();
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: sessionSecret,
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
app.get('/welcome', authController.showLanding);
app.get('/process', authController.showProcess);
app.get('/contact', authController.showContact);

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
app.post(
  '/profile/update',
  authController.requireAuth,
  authController.requireCsrf,
  authController.updateProfile
);

app.post('/login', authController.requireCsrf, authController.login);
app.post('/register', authController.requireCsrf, authController.register);
app.post('/login/google', authController.requireCsrf, authController.loginGoogle);
app.post('/logout', authController.requireAuth, authController.requireCsrf, authController.logout);

// 2. Camera Browsing & Booking
app.get('/browse', cameraController.browseCameras);
app.get('/api/cameras/:cameraId/booked-dates', cameraController.getBookedDates);
app.get('/cart', authController.requireAuth, cartController.showCart);
app.post('/cart/:rentalId/cancel', authController.requireAuth, authController.requireCsrf, cartController.cancelCartItem);
app.post(
  '/admin/cameras',
  authController.requireAdmin,
  uploadImage.single('imageFile'),
  authController.requireCsrf,
  cameraController.addCamera
);
app.post('/book', authController.requireAuth, authController.requireCsrf, cameraController.bookCamera);
app.get('/booking/:bookingId/confirm', authController.requireAuth, cameraController.showBookingConfirm);
app.post('/booking/:bookingId/confirm', authController.requireAuth, authController.requireCsrf, cameraController.confirmBooking);
app.get('/booking/:bookingId/payment', authController.requireAuth, cameraController.showPaymentPage);
app.post(
  '/booking/:bookingId/payment/confirm',
  authController.requireAuth,
  uploadImage.single('slipFile'),
  authController.requireCsrf,
  cameraController.confirmPayment
);

// Centralized Admin Protection
app.use('/admin', authController.requireAdmin);

// Admin dashboard 
app.get('/admin', dashboardController.showDashboard);
app.get('/admin/cameras', cameraController.showAdminCameras);
app.post('/admin/cameras/:id/status', authController.requireCsrf, cameraController.toggleCameraStatus);
app.post('/admin/cameras/:id/delete', authController.requireCsrf, cameraController.deleteCamera);

app.get('/admin/returns', returnController.showAdminReturns);
app.post('/admin/returns/:rentalDetailId', authController.requireCsrf, returnController.processReturn);

app.get('/admin/logs', logController.showAdminLogs);

app.get('/admin/accounts', authController.showAdminAccounts);
app.post('/admin/accounts/role', authController.requireCsrf, authController.updateUserRole);
app.post('/admin/accounts/create-admin', authController.requireCsrf, authController.createAdminAccount);
app.get('/admin/payment-slips', cameraController.showAdminPaymentSlips);
app.post('/admin/payment-slips/:paymentId/approve', authController.requireCsrf, cameraController.approvePaymentSlip);
app.post('/admin/payment-slips/:paymentId/reject', authController.requireCsrf, cameraController.rejectPaymentSlip);
app.get('/admin/media', mediaController.showMediaManager);
app.post(
  '/admin/media/upload',
  uploadImage.single('imageFile'),
  authController.requireCsrf,
  mediaController.uploadMedia
);

// Optional PostgreSQL SQL/report endpoints for pgAdmin class demo.
// Disabled by default (ENABLE_PG_REALTIME=false or unset).
registerPgRealtimeRoutes(app);

const port = Number(process.env.PORT || 3000);
if (require.main === module) {
  initializeApp()
    .then(() => {
      app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
    })
    .catch((error) => {
      // Print full error details (Sequelize validation often hides root cause in .errors).
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = app;
