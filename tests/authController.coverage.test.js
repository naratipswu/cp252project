const authController = require('../CameraRentalSystem/controller/authController');
const Customer = require('../models/customer');
const bcrypt = require('bcryptjs');

jest.mock('../models/customer', () => ({
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn()
}));

function createResponse() {
    return {
        statusCode: 200,
        renderedView: null,
        message: null,
        redirectedTo: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(msg) {
            this.message = msg;
            return this;
        },
        render(view, data) {
            this.renderedView = { view, data };
            return this;
        },
        redirect(path) {
            this.redirectedTo = path;
            return this;
        }
    };
}

describe('AuthController Coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        test('should login hardcoded admin', async () => {
            const req = { body: { username: 'admin', password: 'admin1234' }, session: {} };
            const res = createResponse();
            await authController.login(req, res);
            expect(res.redirectedTo).toBe('/admin');
            expect(req.session.user.role).toBe('admin');
        });

        test('should reject invalid credentials', async () => {
            const req = { body: { username: 'wrong', password: 'wrong' }, session: {} };
            const res = createResponse();
            Customer.findOne.mockResolvedValue(null);
            await authController.login(req, res);
            expect(res.renderedView.view).toBe('signin');
            expect(res.renderedView.data.error).toBe('Invalid username or password');
        });

        test('should reject non-gmail accounts for general users', async () => {
            const req = { body: { username: 'user', password: 'password' }, session: {} };
            const res = createResponse();
            Customer.findOne.mockResolvedValue({ 
                Email: 'test@yahoo.com', 
                PasswordHash: 'hashed' 
            });
            await authController.login(req, res);
            expect(res.renderedView.data.error).toContain('must use a @gmail.com account');
        });

        test('should login user and migrate legacy password', async () => {
            const req = { body: { username: 'user', password: 'plainpassword' }, session: {} };
            const res = createResponse();
            const mockUser = { 
                Username: 'user',
                Email: 'user@gmail.com', 
                PasswordHash: 'plainpassword', // Not a hash
                Role: 'user',
                save: jest.fn()
            };
            Customer.findOne.mockResolvedValue(mockUser);

            await authController.login(req, res);

            expect(mockUser.save).toHaveBeenCalled();
            expect(res.redirectedTo).toBe('/browse');
        });
    });

    describe('register', () => {
        test('should reject missing fields', async () => {
            const req = { body: { username: '' } };
            const res = createResponse();
            await authController.register(req, res);
            expect(res.renderedView.data.error).toBe('All fields are required');
        });

        test('should reject duplicate user', async () => {
            const req = { 
                body: { 
                    username: 'exists', 
                    password: 'password123', 
                    email: 'test@gmail.com',
                    firstName: 'A', lastName: 'B', phone: '1'
                } 
            };
            const res = createResponse();
            Customer.findOne.mockResolvedValue({ Username: 'exists' });
            await authController.register(req, res);
            expect(res.renderedView.data.error).toBe('Username or email already exists');
        });
    });

    describe('loginGoogle', () => {
        test('should login existing google user', async () => {
            const req = { body: { email: 'test@gmail.com' }, session: {} };
            const res = createResponse();
            process.env.ENABLE_MOCK_GOOGLE_LOGIN = 'true';
            process.env.NODE_ENV = 'development';
            Customer.findOne.mockResolvedValue({ Username: 'test', Role: 'user' });

            await authController.loginGoogle(req, res);
            expect(res.redirectedTo).toBe('/browse');
        });

        test('should create new user via google login', async () => {
            const req = { body: { email: 'new@gmail.com' }, session: {} };
            const res = createResponse();
            Customer.findOne.mockResolvedValue(null);
            Customer.create.mockResolvedValue({ Username: 'new@gmail.com', Role: 'user' });

            await authController.loginGoogle(req, res);
            expect(Customer.create).toHaveBeenCalled();
        });
    });

    describe('updateProfile', () => {
        test('should update profile successfully', async () => {
            const req = { 
                session: { user: { username: 'test' } },
                body: { firstName: 'New', lastName: 'Name', email: 'new@gmail.com', phone: '123' } 
            };
            const res = createResponse();
            await authController.updateProfile(req, res);
            expect(Customer.update).toHaveBeenCalled();
            expect(res.redirectedTo).toBe('/profile');
        });
    });

    describe('logout', () => {
        test('should destroy session on logout', () => {
            const req = { session: { destroy: jest.fn((cb) => cb()) } };
            const res = createResponse();
            authController.logout(req, res);
            expect(req.session.destroy).toHaveBeenCalled();
            expect(res.redirectedTo).toBe('/');
        });
    });

    describe('Middleware', () => {
        test('requireAuth should redirect if no user', () => {
            const req = { session: {} };
            const res = createResponse();
            const next = jest.fn();
            authController.requireAuth(req, res, next);
            expect(res.redirectedTo).toBe('/signin');
        });

        test('requireAdmin should redirect if not admin', () => {
            const req = { session: { user: { role: 'user' } } };
            const res = createResponse();
            const next = jest.fn();
            authController.requireAdmin(req, res, next);
            expect(res.redirectedTo).toBe('/welcome');
        });
    });

    describe('showMockGoogleAuth', () => {
        test('should return 403 if disabled', () => {
            const req = {};
            const res = createResponse();
            process.env.ENABLE_MOCK_GOOGLE_LOGIN = 'false';
            authController.showMockGoogleAuth(req, res);
            expect(res.statusCode).toBe(403);
        });

        test('should render google_mock if enabled', () => {
            const req = {};
            const res = createResponse();
            process.env.ENABLE_MOCK_GOOGLE_LOGIN = 'true';
            process.env.NODE_ENV = 'development';
            authController.showMockGoogleAuth(req, res);
            expect(res.renderedView.view).toBe('google_mock');
        });
    });

    describe('show methods', () => {
        test('showMain should redirect if logged in', () => {
            const req = { session: { user: { role: 'admin' } } };
            const res = createResponse();
            authController.showMain(req, res);
            expect(res.redirectedTo).toBe('/admin');
        });

        test('showMain should render main if not logged in', () => {
            const req = { session: {} };
            const res = createResponse();
            authController.showMain(req, res);
            expect(res.renderedView.view).toBe('main');
        });

        test('showLanding should render main', () => {
            const req = { session: {} };
            const res = createResponse();
            authController.showLanding(req, res);
            expect(res.renderedView.view).toBe('main');
        });

        test('showSignIn should render signin', () => {
            const req = { session: {} };
            const res = createResponse();
            authController.showSignIn(req, res);
            expect(res.renderedView.view).toBe('signin');
        });

        test('showSignUp should render signup', () => {
            const req = { session: {} };
            const res = createResponse();
            authController.showSignUp(req, res);
            expect(res.renderedView.view).toBe('signup');
        });

        test('showProcess should render process', () => {
            const req = { session: {} };
            const res = createResponse();
            authController.showProcess(req, res);
            expect(res.renderedView.view).toBe('process');
        });

        test('showContact should render contact', () => {
            const req = { session: {} };
            const res = createResponse();
            authController.showContact(req, res);
            expect(res.renderedView.view).toBe('contact');
        });
    });

    describe('Profile and Admin Accounts', () => {
        test('showAdminAccounts should render accounts', async () => {
            const req = {};
            const res = createResponse();
            Customer.findAll.mockResolvedValue([{ Username: 'a', Role: 'admin' }]);
            await authController.showAdminAccounts(req, res);
            expect(res.renderedView.view).toBe('admin_accounts');
        });

        test('showProfile should render profile', async () => {
            const req = { session: { user: { username: 'test' } } };
            const res = createResponse();
            Customer.findOne.mockResolvedValue({ Username: 'test', Role: 'user' });
            await authController.showProfile(req, res);
            expect(res.renderedView.view).toBe('profile');
        });

        test('updateProfileAvatar should update avatar', async () => {
            const req = { 
                session: { user: { username: 'test' } },
                file: { filename: 'avatar.jpg' }
            };
            const res = createResponse();
            Customer.update.mockResolvedValue([1]);
            await authController.updateProfileAvatar(req, res);
            expect(res.redirectedTo).toBe('/profile');
        });
    });

    describe('Admin Actions', () => {
        test('updateUserRole should update role', async () => {
            const req = { body: { username: 'test', role: 'admin' } };
            const res = createResponse();
            Customer.count.mockResolvedValue(2);
            const mockUser = { update: jest.fn().mockResolvedValue(true) };
            Customer.findOne.mockResolvedValue(mockUser);
            Customer.findAll.mockResolvedValue([]);

            await authController.updateUserRole(req, res);
            expect(mockUser.update).toHaveBeenCalledWith({ Role: 'admin' });
        });

        test('createAdminAccount should create new admin', async () => {
            const req = { body: { username: 'newadmin', email: 'a@gmail.com', password: 'password123' } };
            const res = createResponse();
            Customer.findOne.mockResolvedValue(null);
            Customer.findAll.mockResolvedValue([]);

            await authController.createAdminAccount(req, res);
            expect(Customer.create).toHaveBeenCalled();
        });
    });
});
