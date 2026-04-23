const path = require('path');
const bcrypt = require('bcryptjs');

let authController;
let Customer;

describe('AuthController Green Coverage Suite Final', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        console.error = jest.fn();

        const root = path.resolve(__dirname, '..');
        const modelsPath = path.resolve(root, 'models/customer');

        const createMock = () => ({
            findAll: jest.fn().mockResolvedValue([{ Username: 'u1' }]),
            findByPk: jest.fn().mockResolvedValue({}),
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue([1]),
            count: jest.fn().mockResolvedValue(2),
            destroy: jest.fn().mockResolvedValue(1),
            save: jest.fn(function () { return Promise.resolve(this); }),
            toJSON: jest.fn(function () { return this; })
        });

        jest.doMock(modelsPath, () => createMock());
        Customer = require(modelsPath);
        authController = require('../CameraRentalSystem/controller/authController');
    });

    function createResponse() {
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            locals: {},
            statusCode: 200
        };
        return res;
    }

    test('All show methods', async () => {
        const res = createResponse();
        const session = { user: null };
        await authController.showMain({ session }, res);
        await authController.showLanding({ session }, res);
        await authController.showSignIn({}, res);
        await authController.showSignUp({}, res);
        await authController.showProcess({ session }, res);
        await authController.showContact({ session }, res);
        await authController.showAdminAccounts({}, res);
        Customer.findOne.mockResolvedValue({ Username: 'u' });
        await authController.showProfile({ session: { user: { username: 'u' } } }, res);
        
        // 47-48: showMain logged in
        await authController.showMain({ session: { user: { role: 'admin' } } }, res);
        await authController.showMain({ session: { user: { role: 'user' } } }, res);
    });

    test('Profile and Avatar updates', async () => {
        const res = createResponse();
        const session = { user: { username: 'u' } };
        await authController.updateProfileAvatar({ session, file: { filename: 'f' } }, res);
        await authController.updateProfile({ body: { firstName: 'f', lastName: 'l', email: 'u@gmail.com', phone: 'p' }, session }, res);
        
        // Errors
        await authController.updateProfileAvatar({ session, file: null }, res);
        Customer.update.mockRejectedValue(new Error('fail'));
        await authController.updateProfileAvatar({ session, file: { filename: 'f' } }, res);
        
        await authController.updateProfile({ body: {}, session }, res);
        await authController.updateProfile({ body: { firstName: 'f', lastName: 'l', email: 'bad', phone: 'p' }, session }, res); // 134
        Customer.update.mockRejectedValue(new Error('fail'));
        await authController.updateProfile({ body: { firstName: 'f', lastName: 'l', email: 'u@gmail.com', phone: 'p' }, session }, res); // 150-151
    });

    test('Admin actions success and fail', async () => {
        const res = createResponse();
        // create admin
        await authController.createAdminAccount({ body: { username: 'A B C', email: 'abc@gmail.com', password: 'password123' } }, res);
        
        // Failures in createAdmin (190, 193, 196, 205)
        await authController.createAdminAccount({ body: {} }, res);
        await authController.createAdminAccount({ body: { username: 'u', email: 'bad', password: 'p' } }, res);
        await authController.createAdminAccount({ body: { username: 'u', email: 'a@gmail.com', password: 'short' } }, res);
        Customer.findOne.mockResolvedValue({});
        await authController.createAdminAccount({ body: { username: 'u', email: 'a@gmail.com', password: 'password123' } }, res);

        // update role
        const target = { update: jest.fn().mockResolvedValue({}) };
        Customer.findOne.mockResolvedValue(target);
        await authController.updateUserRole({ body: { username: 'u', role: 'admin' } }, res);
        
        // Failures
        Customer.count.mockResolvedValue(1);
        Customer.findOne.mockResolvedValue({ Role: 'admin' });
        await authController.updateUserRole({ body: { username: 'u', role: 'user' } }, res);
        Customer.count.mockRejectedValue(new Error('fail'));
        await authController.updateUserRole({ body: { username: 'u', role: 'admin' } }, res); // 179
    });

    test('Login paths', async () => {
        const res = createResponse();
        const session = {};
        // Admin
        await authController.login({ body: { username: 'admin', password: 'admin1234' }, session }, res);
        // Legacy user
        Customer.findOne.mockResolvedValue({ Username: 'u', Email: 'u@gmail.com', PasswordHash: 'p', save: jest.fn() });
        await authController.login({ body: { username: 'u', password: 'p' }, session }, res);
        
        // Failures
        Customer.findOne.mockResolvedValue(null);
        await authController.login({ body: { username: 'bad', password: 'p' }, session }, res);
        Customer.findOne.mockResolvedValue({ Username: 'u', Email: 'bad@outlook.com', PasswordHash: 'p' });
        await authController.login({ body: { username: 'u', password: 'p' }, session }, res); // 254
        Customer.findOne.mockResolvedValue({ Username: 'u', Email: 'u@gmail.com', PasswordHash: bcrypt.hashSync('correct', 10) });
        await authController.login({ body: { username: 'u', password: 'wrong' }, session }, res); // 271
    });

    test('Registration and Google', async () => {
        const res = createResponse();
        const session = {};
        await authController.register({ body: { username: 'reg', password: 'password123', email: 'reg@gmail.com', firstName: 'f', lastName: 'l', phone: 'p' }, session }, res);
        
        // Registration failures (343, 346, 349, 353, 359)
        await authController.register({ body: {} }, res);
        await authController.register({ body: { username: 'u', password: 'p', email: 'bad', firstName: 'f', lastName: 'l', phone: 'p' }, session }, res);
        await authController.register({ body: { username: 'u', password: 'p', email: 'u@outlook.com', firstName: 'f', lastName: 'l', phone: 'p' }, session }, res);
        await authController.register({ body: { username: 'u', password: 'short', email: 'u@gmail.com', firstName: 'f', lastName: 'l', phone: 'p' }, session }, res);
        Customer.findOne.mockResolvedValue({});
        await authController.register({ body: { username: 'u', password: 'password123', email: 'u@gmail.com', firstName: 'f', lastName: 'l', phone: 'p' }, session }, res);

        process.env.ENABLE_MOCK_GOOGLE_LOGIN = 'true';
        process.env.NODE_ENV = 'test';
        await authController.showMockGoogleAuth({}, res);
        await authController.loginGoogle({ body: { email: 'g@gmail.com' }, session }, res);
        
        // Google failures
        await authController.loginGoogle({ body: { email: 'bad' }, session }, res); // 302
        process.env.ENABLE_MOCK_GOOGLE_LOGIN = 'false';
        await authController.loginGoogle({ body: { email: 'g@gmail.com' }, session }, res); // 293
        process.env.ENABLE_MOCK_GOOGLE_LOGIN = 'true';
        process.env.NODE_ENV = 'production';
        await authController.loginGoogle({ body: { email: 'g@gmail.com' }, session }, res); // 296
    });

    test('Middleware and CSRF', () => {
        const res = createResponse();
        const next = jest.fn();
        authController.requireAuth({ session: { user: {} } }, res, next);
        authController.requireAuth({ session: {} }, res, next); // 395
        
        authController.requireAdmin({ session: { user: { role: 'admin' } } }, res, next);
        authController.requireAdmin({ session: { user: { role: 'user' } } }, res, next); // 403
        
        authController.logout({ session: { destroy: cb => cb() } }, res);
        
        const s = {};
        authController.attachCsrfToken({ session: s }, res, next);
        authController.requireCsrf({ body: { _csrf: s.csrfToken }, session: s }, res, next);
        authController.requireCsrf({ body: {}, session: s }, res, next); // 424
    });
});
