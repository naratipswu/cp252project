const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { users, bookings, persistData } = require('../model/data');
const { upsertCustomerDirectPg } = require('../service/directPgSync');
const sequelize = require('../../config/db');
const PASSWORD_HASH_ROUNDS = Number(process.env.PASSWORD_HASH_ROUNDS || 10);

function isHash(value) {
    return typeof value === 'string' && value.startsWith('$2');
}

function shouldSyncToPostgres() {
    return sequelize.getDialect() === 'postgres';
}

function splitName(username) {
    const safe = String(username || 'User').trim();
    const chunks = safe.split(/\s+/).filter(Boolean);
    if (chunks.length === 0) return { firstName: 'User', lastName: 'Unknown' };
    if (chunks.length === 1) return { firstName: chunks[0], lastName: 'User' };
    return { firstName: chunks[0], lastName: chunks.slice(1).join(' ') };
}

function normalizePersonFields(input) {
    const firstName = typeof input.firstName === 'string' ? input.firstName.trim() : '';
    const lastName = typeof input.lastName === 'string' ? input.lastName.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const addressRaw = typeof input.address === 'string' ? input.address.trim() : '';
    const address = addressRaw || null;
    return { firstName, lastName, phone, address };
}

function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const normalized = email.trim().toLowerCase();
    if (!normalized || normalized.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

async function upsertCustomerFromUser(user) {
    // Always try direct PostgreSQL upsert first for real-time sync in pgAdmin.
    // If PG is unavailable, this quietly fails and app keeps working in JSON mode.
    await upsertCustomerDirectPg(user);

    if (!shouldSyncToPostgres()) return;
    // Lazy-load DB model only when PostgreSQL sync is enabled.
    // This keeps tests/local JSON mode free from DB open handles.
    // eslint-disable-next-line global-require
    const Customer = require('../../models/customer');
    const email = (user.email || `${user.username}@legacy.local`).toLowerCase();
    const person = normalizePersonFields(user);
    const existing = await Customer.findOne({ where: { Email: email } });
    if (existing) return;
    const fallbackName = splitName(user.username);
    await Customer.create({
        FirstName: person.firstName || fallbackName.firstName,
        LastName: person.lastName || fallbackName.lastName,
        Username: user.username,
        Phone: person.phone || '0000000000',
        Email: email,
        Address: person.address || null
    });
}

exports.showMain = (req, res) => {
    // If already logged in, redirect
    if (req.session.user) {
        if(req.session.user.role === 'admin') return res.redirect('/admin');
        return res.redirect('/browse');
    }
    res.render('main', { error: null });
};

exports.showSignIn = (req, res) => {
    res.render('signin', { error: null });
};

exports.showSignUp = (req, res) => {
    res.render('signup', { error: null });
};

exports.showAdminAccounts = (req, res) => {
    return res.render('admin_accounts', {
        users,
        error: null,
        success: null
    });
};

exports.showProfile = (req, res) => {
    const currentUsername = req.session.user && req.session.user.username;
    const user = users.find((item) => item.username === currentUsername);
    if (!user) {
        return res.status(404).send('User not found');
    }

    const userBookings = bookings
        .filter((booking) => booking.user === currentUsername)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.render('profile', {
        user: {
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar || null
        },
        bookings: userBookings
    });
};

exports.updateProfileAvatar = (req, res) => {
    const currentUsername = req.session.user && req.session.user.username;
    const user = users.find((item) => item.username === currentUsername);
    if (!user) {
        return res.status(404).send('User not found');
    }
    if (!req.file) {
        return res.status(400).send('Please upload an image');
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    persistData();
    return res.redirect('/profile');
};

exports.updateUserRole = (req, res) => {
    const { username, role } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedRole = role === 'admin' ? 'admin' : 'user';

    const targetUser = users.find((item) => item.username === normalizedUsername);
    if (!targetUser) {
        return res.status(404).render('admin_accounts', {
            users,
            error: 'User not found',
            success: null
        });
    }

    if (targetUser.role === 'admin' && normalizedRole === 'user') {
        const adminCount = users.filter((item) => item.role === 'admin').length;
        if (adminCount <= 1) {
            return res.status(400).render('admin_accounts', {
                users,
                error: 'Cannot demote the last admin account',
                success: null
            });
        }
    }

    targetUser.role = normalizedRole;
    persistData();
    return res.render('admin_accounts', {
        users,
        error: null,
        success: `Updated role for ${targetUser.username} to ${normalizedRole}`
    });
};

exports.createAdminAccount = async (req, res) => {
    const { username, email, password } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';

    if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
        return res.status(400).render('admin_accounts', {
            users,
            error: 'Username, email and password are required',
            success: null
        });
    }
    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).render('admin_accounts', {
            users,
            error: 'Please provide a valid email address',
            success: null
        });
    }
    if (normalizedPassword.length < 8) {
        return res.status(400).render('admin_accounts', {
            users,
            error: 'Password must be at least 8 characters',
            success: null
        });
    }
    const duplicateUser = users.find(
        (item) => item.username === normalizedUsername || item.email === normalizedEmail
    );
    if (duplicateUser) {
        return res.status(400).render('admin_accounts', {
            users,
            error: 'Username or email already exists',
            success: null
        });
    }

    const newAdmin = {
        username: normalizedUsername,
        email: normalizedEmail,
        password: bcrypt.hashSync(normalizedPassword, PASSWORD_HASH_ROUNDS),
        role: 'admin',
        avatar: null
    };
    users.push(newAdmin);
    persistData();
    await upsertCustomerFromUser(newAdmin);

    return res.render('admin_accounts', {
        users,
        error: null,
        success: `Created admin account: ${normalizedUsername}`
    });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';

    const matchedUser = users.find((user) => user.username === normalizedUsername);
    if (!matchedUser || !matchedUser.password) {
        return res.render('signin', { error: 'Invalid username or password' });
    }

    const passwordMatches = isHash(matchedUser.password)
        ? await bcrypt.compare(normalizedPassword, matchedUser.password)
        : matchedUser.password === normalizedPassword;

    if (passwordMatches) {
        // Opportunistically migrate legacy plaintext passwords.
        if (!isHash(matchedUser.password)) {
            matchedUser.password = await bcrypt.hash(normalizedPassword, PASSWORD_HASH_ROUNDS);
            persistData();
        }
        req.session.user = { username: matchedUser.username, role: matchedUser.role };
        if (matchedUser.role === 'admin') return res.redirect('/admin');
        return res.redirect('/browse');
    }
    res.render('signin', { error: 'Invalid username or password' });
};

// Mock Google Login
exports.loginGoogle = async (req, res) => {
    const isMockGoogleEnabled = process.env.ENABLE_MOCK_GOOGLE_LOGIN === 'true';
    const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
    const isSafeEnv = nodeEnv === 'development' || nodeEnv === 'dev' || nodeEnv === 'test';
    if (!isMockGoogleEnabled) {
        return res.status(403).send('Google login is disabled');
    }
    if (!isSafeEnv) {
        return res.status(403).send('Google mock login is only available in development/test');
    }

    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!isValidEmail(normalizedEmail)) {
        return res.render('signin', { error: 'Please provide a valid email' });
    }

    let matchedUser = users.find((user) => user.email === normalizedEmail);
    if (!matchedUser) {
        matchedUser = {
            username: normalizedEmail,
            password: null,
            email: normalizedEmail,
            role: 'user'
        };
        users.push(matchedUser);
        persistData();
        await upsertCustomerFromUser(matchedUser);
    }

    req.session.user = { username: matchedUser.username, role: matchedUser.role };
    return res.redirect('/browse');
};

exports.register = async (req, res) => {
    const { username, password, email, firstName, lastName, phone, address } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    const normalizedAddress = typeof address === 'string' ? address.trim() : '';

    if (!normalizedUsername || !normalizedPassword || !normalizedEmail || !normalizedFirstName || !normalizedLastName || !normalizedPhone) {
        return res.render('signup', { error: 'All fields are required' });
    }
    if (!isValidEmail(normalizedEmail)) {
        return res.render('signup', { error: 'Please provide a valid email address' });
    }

    if (normalizedPassword.length < 8) {
        return res.render('signup', { error: 'Password must be at least 8 characters' });
    }

    const duplicateUser = users.find(
        (user) => user.username === normalizedUsername || user.email === normalizedEmail
    );
    if (duplicateUser) {
        return res.render('signup', { error: 'Username or email already exists' });
    }

    const newUser = {
        username: normalizedUsername,
        password: bcrypt.hashSync(normalizedPassword, PASSWORD_HASH_ROUNDS),
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        phone: normalizedPhone,
        address: normalizedAddress || null,
        role: 'user',
        avatar: null
    };
    users.push(newUser);
    persistData();
    await upsertCustomerFromUser(newUser);

    req.session.user = { username: normalizedUsername, role: 'user' };
    return res.redirect('/browse');
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send('Could not log out');
        res.redirect('/');
    });
};

exports.requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/signin');
    }
};

exports.requireAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/');
    }
};

exports.attachCsrfToken = (req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
};

exports.requireCsrf = (req, res, next) => {
    const csrfFromBody = req.body && req.body._csrf;
    if (!csrfFromBody || !req.session.csrfToken || csrfFromBody !== req.session.csrfToken) {
        return res.status(403).send('Invalid CSRF token');
    }
    next();
};
