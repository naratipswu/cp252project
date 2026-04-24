const sequelize = require('../config/db');
const { ensureFullSchemaReady } = require('../CameraRentalSystem/service/schemaSync');
// const models = require('../models');

jest.mock('../config/db', () => {
    const mQI = {
        showAllTables: jest.fn().mockResolvedValue([]),
        describeTable: jest.fn().mockResolvedValue({}),
        addColumn: jest.fn().mockResolvedValue({}),
    };
    return {
        authenticate: jest.fn().mockResolvedValue({}),
        getQueryInterface: jest.fn(() => mQI),
        query: jest.fn().mockResolvedValue([]),
    };
});

// Mock models
jest.mock('../models', () => {
    const m = () => ({ sync: jest.fn().mockResolvedValue({}) });
    return {
        Category: m(),
        Equipment: m(),
        Customer: m(),
        Rental: m(),
        RentalDetail: m(),
        Payment: m(),
        Return: m(),
        SyncLog: m()
    };
});

describe('SchemaSync Service Max Coverage', () => {
    let qi;

    beforeEach(() => {
        jest.clearAllMocks();
        qi = sequelize.getQueryInterface();
    });

    test('ensureFullSchemaReady with various states', async () => {
        qi.showAllTables.mockResolvedValue([]);
        qi.describeTable.mockResolvedValue({});
        process.env.DB_SYNC_ALTER = 'true';
        
        await ensureFullSchemaReady();
        
        expect(sequelize.authenticate).toHaveBeenCalled();
        expect(qi.addColumn).toHaveBeenCalled();
    });

    test('normalizeTableName coverage', async () => {
        qi.showAllTables.mockResolvedValue([
            'StringTable',
            { tableName: 'ObjectTable' },
            null
        ]);
        qi.describeTable.mockResolvedValue({
            PasswordHash: {}, AvatarPath: {}, Role: {},
            SlipPath: {}, PaymentStatus: {}
        });

        await ensureFullSchemaReady();
    });

    test('migrateLegacyPostgresTables branches', async () => {
        qi.showAllTables.mockResolvedValue(['Users', 'Cameras', 'Bookings', 'Payments']);
        qi.describeTable.mockResolvedValue({
            PasswordHash: {}, AvatarPath: {}, Role: {},
            SlipPath: {}, PaymentStatus: {}
        });

        await ensureFullSchemaReady();
        expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "Customer"'));
        expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "Equipment"'));
        expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "Rental"'));
        expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "Payment"'));

        jest.clearAllMocks();
        qi.showAllTables.mockResolvedValue(['Bookings']);
        await ensureFullSchemaReady();
        expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('JOIN "Customer" c ON c."Email"'));
    });

    test('ensureCustomerAuthColumns branch when Role missing', async () => {
        qi.describeTable.mockResolvedValue({ PasswordHash: {}, AvatarPath: {} });
        await ensureFullSchemaReady();
        expect(qi.addColumn).toHaveBeenCalledWith('Customer', 'Role', expect.any(Object));
    });
});
