const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { users, bookings, persistData } = require('../model/data');
const PASSWORD_HASH_ROUNDS = Number(process.env.PASSWORD_HASH_ROUNDS || 10);

function isHash(value) {
    return typeof value === 'string' && value.startsWith('$2');
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
exports.loginGoogle = (req, res) => {
    const isMockGoogleEnabled = process.env.ENABLE_MOCK_GOOGLE_LOGIN === 'true';
    if (!isMockGoogleEnabled) {
        return res.status(403).send('Google login is disabled');
    }

    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
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
    }

    req.session.user = { username: matchedUser.username, role: matchedUser.role };
    return res.redirect('/browse');
};

exports.register = (req, res) => {
    const { username, password, email } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedUsername || !normalizedPassword || !normalizedEmail) {
        return res.render('signup', { error: 'All fields are required' });
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

    users.push({
        username: normalizedUsername,
        password: bcrypt.hashSync(normalizedPassword, PASSWORD_HASH_ROUNDS),
        email: normalizedEmail,
        role: 'user',
        avatar: null
    });
    persistData();

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
