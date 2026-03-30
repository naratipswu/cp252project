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

// Hardcoded Admin
exports.loginAdmin = (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password123') {
        req.session.user = { username: 'admin', role: 'admin' };
        return res.redirect('/admin');
    }
    res.render('main', { error: 'Invalid admin credentials' });
};

// Mock Google Login
exports.loginGoogle = (req, res) => {
    const { email } = req.body;
    if (email) {
        req.session.user = { username: email, role: 'user' };
        return res.redirect('/browse');
    }
    res.redirect('/');
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
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
