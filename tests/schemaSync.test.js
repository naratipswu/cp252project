const { ensureFullSchemaReady } = require('../CameraRentalSystem/service/schemaSync');
const sequelize = require('../config/db');
const { Category, Equipment, Customer, Rental, RentalDetail, Payment, Return, SyncLog } = require('../models');

const mockQI = {
    showAllTables: jest.fn().mockResolvedValue(['Users', 'Cameras']),
    describeTable: jest.fn().mockResolvedValue({}),
    addColumn: jest.fn().mockResolvedValue(true)
};

jest.mock('../config/db', () => ({
    authenticate: jest.fn(),
    query: jest.fn(),
    getQueryInterface: jest.fn(() => mockQI)
}));

jest.mock('../models', () => ({
    Category: { sync: jest.fn() },
    Equipment: { sync: jest.fn() },
    Customer: { sync: jest.fn() },
    Rental: { sync: jest.fn() },
    RentalDetail: { sync: jest.fn() },
    Payment: { sync: jest.fn() },
    Return: { sync: jest.fn() },
    SyncLog: { sync: jest.fn() }
}));

describe('SchemaSync Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should ensure full schema is ready', async () => {
        await ensureFullSchemaReady();

        expect(sequelize.authenticate).toHaveBeenCalled();
        expect(Category.sync).toHaveBeenCalled();
        expect(Equipment.sync).toHaveBeenCalled();
        expect(Customer.sync).toHaveBeenCalled();
        expect(Rental.sync).toHaveBeenCalled();
        expect(RentalDetail.sync).toHaveBeenCalled();
        expect(Payment.sync).toHaveBeenCalled();
        expect(Return.sync).toHaveBeenCalled();
        expect(SyncLog.sync).toHaveBeenCalled();
    });

    test('should handle migration and column checks', async () => {
        await ensureFullSchemaReady();
        
        expect(mockQI.describeTable).toHaveBeenCalledWith('Customer');
        expect(mockQI.describeTable).toHaveBeenCalledWith('Payment');
        expect(sequelize.query).toHaveBeenCalled();
    });
});
