const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_CATEGORIES = ['products', 'website', 'slips', 'avatars', 'others'];
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

function ensureUploadDirectories() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  UPLOAD_CATEGORIES.forEach((category) => {
    const target = path.join(UPLOADS_DIR, category);
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
  });
}

function normalizeBaseName(name) {
  return String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'file';
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const category = UPLOAD_CATEGORIES.includes(req.body.category) ? req.body.category : 'others';
    cb(null, path.join(UPLOADS_DIR, category));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const base = normalizeBaseName(path.basename(file.originalname || 'file', ext));
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = crypto.randomBytes(4).toString('hex');
    cb(null, `${base}-${stamp}-${rand}${ext}`);
  }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
      return cb(new Error('Only image files are allowed'));
    }
    return cb(null, true);
  }
});

module.exports = {
  UPLOAD_CATEGORIES,
  UPLOADS_DIR,
  ensureUploadDirectories,
  uploadImage
};
