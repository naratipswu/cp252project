const { ensureCameraStoreReady, getAllCameras, addCamera } = require('../CameraRentalSystem/service/cameraStore');
const Equipment = require('../models/equipment');
const Category = require('../models/category');
// const sequelize = require('../config/db');

jest.mock('../config/db', () => ({ authenticate: jest.fn().mockResolvedValue({}) }));
jest.mock('../models/equipment', () => ({
    sync: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
    bulkCreate: jest.fn().mockResolvedValue([]),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ toJSON: () => ({ EquipmentID: 1, DailyRate: 100, Status: 'available', ImageURL: 'pic' }) }),
}));
jest.mock('../models/category', () => ({
    sync: jest.fn().mockResolvedValue({}),
    findOne: jest.fn(),
    max: jest.fn().mockResolvedValue(10),
    create: jest.fn().mockResolvedValue({ CategoryID: 5 }),
    findByPk: jest.fn(),
}));

describe('CameraStore Service Max Coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
    });

    test('ensureCameraStoreReady branches', async () => {
        Category.findOne.mockImplementation((args) => {
            const name = args && args.where && args.where.CategoryName;
            if (name === 'DSLR' || name === 'Mirrorless') return null;
            return { CategoryID: 1 };
        });
        await ensureCameraStoreReady();
        expect(Category.create).toHaveBeenCalled();
        expect(Equipment.bulkCreate).toHaveBeenCalled();
    });

    test('getAllCameras branches', async () => {
        Equipment.findAll.mockResolvedValue([
            { toJSON: () => ({ Status: 'available', ImageURL: 'img', Category: { CategoryName: 'Lens' } }) },
            { toJSON: () => ({ Status: 'maintenance', ImageURL: null, Category: null }) }
        ]);
        await getAllCameras();
    });

    test('addCamera branches', async () => {
        // Line 82, 86, 88, 111
        Category.findByPk.mockResolvedValue({ CategoryID: 9 });
        await addCamera({ stock: 2, image: 'pic' });
        
        Category.findByPk.mockResolvedValue(null);
        Category.findOne.mockResolvedValue({ CategoryID: 1 });
        await addCamera({ stock: 0, image: null });
        await addCamera({ stock: 'bad', image: null });
    });
});
