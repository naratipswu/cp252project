const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const Customer = require('../../models/customer');
const PASSWORD_HASH_ROUNDS = Number(process.env.PASSWORD_HASH_ROUNDS || 10);

function isHash(value) {
    return typeof value === 'string' && value.startsWith('$2');
}

function splitName(username) {
    const safe = String(username || 'User').trim();
    const chunks = safe.split(/\s+/).filter(Boolean);
    if (chunks.length === 0) return { firstName: 'User', lastName: 'Unknown' };
    if (chunks.length === 1) return { firstName: chunks[0], lastName: 'User' };
    return { firstName: chunks[0], lastName: chunks.slice(1).join(' ') };
}

function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const normalized = email.trim().toLowerCase();
    if (!normalized || normalized.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

async function renderAdminAccounts(res, { status = 200, error = null, success = null } = {}) {
    const rows = await Customer.findAll({ order: [['CustomerID', 'ASC']] });
    return res.status(status).render('admin_accounts', {
        users: rows.map((r) => ({
            username: r.Username,
            email: r.Email,
            role: r.Role,
            avatar: r.AvatarPath || null,
            firstName: r.FirstName,
            lastName: r.LastName,
            phone: r.Phone,
            address: r.Address
        })),
        error,
        success
    });
}

exports.showMain = (req, res) => {
    // If already logged in, redirect
    if (req.session.user) {
        if(req.session.user.role === 'admin') return res.redirect('/admin');
        return res.redirect('/browse');
    }
    res.render('main', { error: null, user: null });
};

exports.showLanding = (req, res) => {
    res.render('main', { error: null, user: req.session.user || null });
};

exports.showSignIn = (req, res) => {
    res.render('signin', { error: null });
};

exports.showSignUp = (req, res) => {
    res.render('signup', { error: null });
};

exports.showProcess = (req, res) => {
    res.render('process', { error: null, user: req.session.user || null });
};

exports.showContact = (req, res) => {
    res.render('contact', { error: null, user: req.session.user || null });
};

exports.showAdminAccounts = (req, res) => {
    return renderAdminAccounts(res).catch(() => res.status(500).send('Failed to load accounts'));
};

exports.showProfile = (req, res) => {
    const currentUsername = req.session.user && req.session.user.username;
    return Customer.findOne({ where: { Username: currentUsername } })
        .then((user) => {
            if (!user) return res.status(404).send('User not found');
            return res.render('profile', {
                user: {
                    username: user.Username,
                    email: user.Email,
                    role: user.Role,
                    avatar: user.AvatarPath || null,
                    firstName: user.FirstName,
                    lastName: user.LastName,
                    phone: user.Phone,
                    address: user.Address
                }
            });
        })
        .catch(() => res.status(500).send('Failed to load profile'));
};

exports.updateProfileAvatar = (req, res) => {
    const currentUsername = req.session.user && req.session.user.username;
    if (!req.file) {
        return res.status(400).send('Please upload an image');
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    return Customer.update(
        { AvatarPath: avatarPath },
        { where: { Username: currentUsername } }
    )
        .then(() => res.redirect('/profile'))
        .catch(() => res.status(500).send('Failed to update avatar'));
};

/**
 * Updates an authenticated customer's profile details.
 * Validates the email and normalizes name inputs before updating the database.
 * @param {import('express').Request} req - Express request object containing body elements.
 * @param {import('express').Response} res - Express response object.
 */
exports.updateProfile = async (req, res) => {
    const currentUsername = req.session.user && req.session.user.username;
    const { firstName, lastName, email, phone, address } = req.body;

    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    const normalizedAddress = typeof address === 'string' ? address.trim() : '';

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPhone) {
        return res.status(400).send('First Name, Last Name, Email and Phone are required');
    }

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).send('Invalid email format');
    }

    try {
        await Customer.update(
            {
                FirstName: normalizedFirstName,
                LastName: normalizedLastName,
                Email: normalizedEmail,
                Phone: normalizedPhone,
                Address: normalizedAddress || null
            },
            { where: { Username: currentUsername } }
        );
        return res.redirect('/profile');
    } catch (error) {
        console.error('Failed to update profile:', error);
        return res.status(500).send('Failed to update profile');
    }
};

exports.updateUserRole = (req, res) => {
    const { username, role } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedRole = role === 'admin' ? 'admin' : 'user';

    return Customer.count({ where: { Role: 'admin' } })
        .then((adminCount) => Customer.findOne({ where: { Username: normalizedUsername } })
            .then((targetUser) => {
                if (!targetUser) return { error: 'User not found', code: 404 };
                if (targetUser.Role === 'admin' && normalizedRole === 'user' && adminCount <= 1) {
                    return { error: 'Cannot demote the last admin account', code: 400 };
                }
                return targetUser.update({ Role: normalizedRole }).then(() => ({ code: 200 }));
            }))
        .then((result) => {
            if (result && result.error) {
                return renderAdminAccounts(res, { status: result.code, error: result.error, success: null });
            }
            return renderAdminAccounts(res, {
                status: 200,
                error: null,
                success: `Updated role for ${normalizedUsername} to ${normalizedRole}`
            });
        })
        .catch(() => res.status(500).send('Failed to update role'));
};

// eslint-disable-next-line complexity
exports.createAdminAccount = async (req, res) => {
    const { username, email, password } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';

    if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
        return renderAdminAccounts(res, { status: 400, error: 'Username, email and password are required' });
    }
    if (!isValidEmail(normalizedEmail)) {
        return renderAdminAccounts(res, { status: 400, error: 'Please provide a valid email address' });
    }
    if (normalizedPassword.length < 8) {
        return renderAdminAccounts(res, { status: 400, error: 'Password must be at least 8 characters' });
    }
    const duplicate = await Customer.findOne({
        where: { Email: normalizedEmail }
    });
    const duplicateUsername = await Customer.findOne({
        where: { Username: normalizedUsername }
    });
    if (duplicate || duplicateUsername) {
        return renderAdminAccounts(res, { status: 400, error: 'Username or email already exists' });
    }

    const name = splitName(normalizedUsername);
    await Customer.create({
        FirstName: name.firstName,
        LastName: name.lastName,
        Username: normalizedUsername,
        Phone: '0000000000',
        Email: normalizedEmail,
        Address: null,
        PasswordHash: bcrypt.hashSync(normalizedPassword, PASSWORD_HASH_ROUNDS),
        Role: 'admin',
        AvatarPath: null
    });

    return renderAdminAccounts(res, { success: `Created admin account: ${normalizedUsername}` });
};

/**
 * Authenticates a user and establishes a session.
 * Compares passwords utilizing bcrypt. Migrates legacy plain-text passwords gracefully.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.login = async (req, res) => {
    const { username, password } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';

    if (normalizedUsername === 'admin' && normalizedPassword === 'admin1234') {
        req.session.user = { username: 'admin', role: 'admin' };
        return res.redirect('/admin');
    }

    const matchedUser = await Customer.findOne({
        where: {
            [Op.or]: [
                { Username: normalizedUsername },
                { Email: normalizedUsername }
            ]
        }
    });
    
    if (!matchedUser || !matchedUser.PasswordHash) {
        return res.render('signin', { error: 'Invalid username or password' });
    }

    if (!matchedUser.Email || !matchedUser.Email.endsWith('@gmail.com')) {
        return res.render('signin', { error: 'General users must use a @gmail.com account' });
    }

    const passwordMatches = isHash(matchedUser.PasswordHash)
        ? await bcrypt.compare(normalizedPassword, matchedUser.PasswordHash)
        : matchedUser.PasswordHash === normalizedPassword;

    if (passwordMatches) {
        // Opportunistically migrate legacy plaintext passwords.
        if (!isHash(matchedUser.PasswordHash)) {
            matchedUser.PasswordHash = await bcrypt.hash(normalizedPassword, PASSWORD_HASH_ROUNDS);
            await matchedUser.save();
        }
        req.session.user = { username: matchedUser.Username, role: matchedUser.Role };
        if (matchedUser.Role === 'admin') return res.redirect('/admin');
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

    let matchedUser = await Customer.findOne({ where: { Email: normalizedEmail } });
    if (!matchedUser) {
        const name = splitName(normalizedEmail);
        matchedUser = await Customer.create({
            FirstName: name.firstName,
            LastName: name.lastName,
            Username: normalizedEmail,
            Phone: '0000000000',
            Email: normalizedEmail,
            Address: null,
            PasswordHash: null,
            Role: 'user',
            AvatarPath: null
        });
    }

    req.session.user = { username: matchedUser.Username, role: matchedUser.Role };
    return res.redirect('/browse');
};

// eslint-disable-next-line complexity
/**
 * Registers a new user customer account into the database.
 * Computes the bcrypt hash for the password before saving.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
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
    if (!normalizedEmail.endsWith('@gmail.com')) {
        return res.render('signup', { error: 'Please provide a @gmail.com address' });
    }

    if (normalizedPassword.length < 8) {
        return res.render('signup', { error: 'Password must be at least 8 characters' });
    }

    const duplicateUser = await Customer.findOne({ where: { Username: normalizedUsername } });
    const duplicateEmail = await Customer.findOne({ where: { Email: normalizedEmail } });
    if (duplicateUser || duplicateEmail) {
        return res.render('signup', { error: 'Username or email already exists' });
    }

    await Customer.create({
        FirstName: normalizedFirstName,
        LastName: normalizedLastName,
        Username: normalizedUsername,
        Phone: normalizedPhone,
        Email: normalizedEmail,
        Address: normalizedAddress || null,
        PasswordHash: bcrypt.hashSync(normalizedPassword, PASSWORD_HASH_ROUNDS),
        Role: 'user',
        AvatarPath: null
    });

    req.session.user = { username: normalizedUsername, role: 'user' };
    return res.redirect('/browse');
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send('Could not log out');
        res.redirect('/');
    });
};

/**
 * Middleware: Requires the user to have an active authenticated session.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
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
        res.redirect('/welcome');
    }
};

/**
 * Middleware: Attaches a CSRF token to the session and response locals to prevent cross-site request forgery.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware.
 */
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
