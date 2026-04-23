const { ensureAdminSeed } = require('../CameraRentalSystem/service/adminSeed');
const Customer = require('../models/customer');

jest.mock('../models/customer', () => ({
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
}));

describe('AdminSeed Service Max Coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_USERNAME = 'admin';
        process.env.ADMIN_EMAIL = 'admin@test.com';
        process.env.ADMIN_PASSWORD = 'password123456';
    });

    test('ensureAdminSeed branch coverage push', async () => {
        // 1. Line 11: username empty
        process.env.ADMIN_USERNAME = '';
        await expect(ensureAdminSeed()).rejects.toThrow('No admin account exists');
        process.env.ADMIN_USERNAME = 'admin';
        
        // 2. Line 11: email empty
        process.env.ADMIN_EMAIL = '';
        await expect(ensureAdminSeed()).rejects.toThrow('No admin account exists');
        process.env.ADMIN_EMAIL = 'admin@test.com';

        // 3. Line 11: password empty
        process.env.ADMIN_PASSWORD = '';
        await expect(ensureAdminSeed()).rejects.toThrow('No admin account exists');
        process.env.ADMIN_PASSWORD = 'password123456';

        // 4. Line 38-42: existing user with all fields vs missing fields
        Customer.count.mockResolvedValue(0);
        
        // existing has nothing
        const mockUser1 = { save: jest.fn() };
        Customer.findOne.mockResolvedValue(mockUser1);
        await ensureAdminSeed();
        expect(mockUser1.PasswordHash).toBeDefined();
        expect(mockUser1.Username).toBe('admin');
        expect(mockUser1.Email).toBe('admin@test.com');

        // existing has everything
        const mockUser2 = { Username: 'u', Email: 'e', PasswordHash: 'h', save: jest.fn() };
        Customer.findOne.mockResolvedValue(mockUser2);
        await ensureAdminSeed();
        expect(mockUser2.Username).toBe('u');
        expect(mockUser2.Email).toBe('e');
        expect(mockUser2.PasswordHash).toBe('h');
    });

    test('ensureAdminSeed final coverage', async () => {
        Customer.count.mockResolvedValue(1);
        await ensureAdminSeed();

        Customer.count.mockResolvedValue(0);
        Customer.findOne.mockResolvedValue(null);
        await ensureAdminSeed();
        expect(Customer.create).toHaveBeenCalled();
    });
});
