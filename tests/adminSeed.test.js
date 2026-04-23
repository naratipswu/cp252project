const { ensureAdminSeed } = require('../CameraRentalSystem/service/adminSeed');
const Customer = require('../models/customer');

jest.mock('../models/customer', () => ({
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
}));

describe('AdminSeed Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_USERNAME = 'admin';
        process.env.ADMIN_EMAIL = 'admin@example.com';
        process.env.ADMIN_PASSWORD = 'very-strong-password-123';
    });

    test('should do nothing if admin exists', async () => {
        Customer.count.mockResolvedValue(1);
        await ensureAdminSeed();
        expect(Customer.create).not.toHaveBeenCalled();
    });

    test('should create admin if missing', async () => {
        Customer.count.mockResolvedValue(0);
        Customer.findOne.mockResolvedValue(null);
        await ensureAdminSeed();
        expect(Customer.create).toHaveBeenCalled();
    });

    test('should promote existing user to admin', async () => {
        Customer.count.mockResolvedValue(0);
        const mockUser = { Username: 'admin', save: jest.fn() };
        Customer.findOne.mockResolvedValue(mockUser);
        
        await ensureAdminSeed();
        
        expect(mockUser.Role).toBe('admin');
        expect(mockUser.save).toHaveBeenCalled();
        expect(Customer.create).not.toHaveBeenCalled();
    });

    test('should throw error if env vars missing', async () => {
        Customer.count.mockResolvedValue(0);
        delete process.env.ADMIN_USERNAME;
        await expect(ensureAdminSeed()).rejects.toThrow('No admin account exists');
    });
});
