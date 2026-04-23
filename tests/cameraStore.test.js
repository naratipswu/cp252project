const cameraStore = require('../CameraRentalSystem/service/cameraStore');
const sequelize = require('../config/db');
const Equipment = require('../models/equipment');
const Category = require('../models/category');

jest.mock('../config/db', () => ({
    authenticate: jest.fn()
}));

jest.mock('../models/equipment', () => ({
    sync: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn()
}));

jest.mock('../models/category', () => ({
    sync: jest.fn(),
    findOne: jest.fn(),
    max: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
}));

describe('CameraStore Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ensureCameraStoreReady', () => {
        test('should seed data if store is empty', async () => {
            Equipment.count.mockResolvedValue(0);
            Category.findOne.mockResolvedValue(null);
            Category.findOne.mockResolvedValueOnce(null) // DSLR
                           .mockResolvedValueOnce(null) // Mirrorless
                           .mockResolvedValueOnce(null) // Lens
                           .mockResolvedValueOnce(null) // Action Camera
                           .mockResolvedValueOnce(null) // General
                           .mockResolvedValue({ CategoryID: 1 }); // Default category for equipment
            Category.max.mockResolvedValue(0);

            await cameraStore.ensureCameraStoreReady();

            expect(sequelize.authenticate).toHaveBeenCalled();
            expect(Category.create).toHaveBeenCalled(); // Seeding categories
            expect(Equipment.bulkCreate).toHaveBeenCalled(); // Seeding equipment
        });

        test('should skip seeding if data exists', async () => {
            Equipment.count.mockResolvedValue(10);
            Category.findOne.mockResolvedValue({ CategoryID: 1 });

            await cameraStore.ensureCameraStoreReady();

            expect(Equipment.bulkCreate).not.toHaveBeenCalled();
        });
    });

    describe('getAllCameras', () => {
        test('should return formatted cameras', async () => {
            const mockRow = {
                EquipmentID: 1,
                ModelName: 'R5',
                Brand: 'Canon',
                DailyRate: 1000,
                Status: 'available',
                ImageURL: 'img',
                CategoryID: 2,
                Category: { CategoryName: 'Mirrorless' },
                toJSON: function() { return this; }
            };
            Equipment.findAll.mockResolvedValue([mockRow]);

            const cameras = await cameraStore.getAllCameras();
            expect(cameras.length).toBe(1);
            expect(cameras[0].model).toBe('R5');
            expect(cameras[0].categoryName).toBe('Mirrorless');
        });
    });

    describe('addCamera', () => {
        test('should create multiple records if stock > 1', async () => {
            Category.findByPk.mockResolvedValue({ CategoryID: 1 });
            Equipment.create.mockResolvedValue({ 
                EquipmentID: 99, 
                toJSON: () => ({ EquipmentID: 99, ModelName: 'X', Brand: 'Y', DailyRate: 100 }) 
            });

            const result = await cameraStore.addCamera({ brand: 'Y', model: 'X', stock: 3, pricePerDay: 100 });
            
            expect(Equipment.create).toHaveBeenCalledTimes(3);
            expect(result.id).toBe(99);
        });
    });
});
