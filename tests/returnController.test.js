const returnController = require('../CameraRentalSystem/controller/returnController');
const { RentalDetail, Return, Equipment } = require('../models');
// const sequelize = require('../config/db');

jest.mock('../config/db', () => ({
    transaction: jest.fn((options, callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })),
}));

jest.mock('../models', () => ({
    RentalDetail: { findAll: jest.fn(), findByPk: jest.fn() },
    Return: { findOne: jest.fn(), create: jest.fn() },
    SyncLog: { create: jest.fn() },
    Equipment: { findByPk: jest.fn() },
    Customer: {},
    Rental: {}
}));

describe('ReturnController Max Coverage', () => {
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };
        console.error = jest.fn();
    });

    test('showAdminReturns all branches', async () => {
        RentalDetail.findAll.mockResolvedValue([
            {
                RentalDetailID: 1,
                Rental: { RentalID: 1, TotalAmount: 100, Customer: { Username: 'u' } },
                Equipment: { Brand: 'B', ModelName: 'M' },
                Return: null
            },
            {
                RentalDetailID: 2,
                Rental: { RentalID: 2, TotalAmount: 200, Customer: { Username: 'u2' } },
                Equipment: { Brand: 'B2', ModelName: 'M2' },
                Return: { ActualReturnDate: '2023-01-01', LateFee: 0, DamageFee: 0, Notes: '' }
            }
        ]);
        await returnController.showAdminReturns({ session: {} }, res);
        expect(res.render).toHaveBeenCalled();

        RentalDetail.findAll.mockRejectedValue(new Error('fail'));
        await returnController.showAdminReturns({ session: {} }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('processReturn all branches', async () => {
        // Invalid ID
        await returnController.processReturn({ params: { rentalDetailId: 0 }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);

        // Success path
        RentalDetail.findByPk.mockResolvedValue({
            Rental: { RentalStatus: 'completed' },
            EquipmentID: 99
        });
        Return.findOne.mockResolvedValue(null);
        Equipment.findByPk.mockResolvedValue({ save: jest.fn() });
        await returnController.processReturn({ params: { rentalDetailId: 1 }, body: { lateFee: 10 } }, res);
        expect(res.redirect).toHaveBeenCalled();

        // 404 Detail not found
        RentalDetail.findByPk.mockResolvedValue(null);
        await returnController.processReturn({ params: { rentalDetailId: 1 }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(404);

        // 400 Status not completed
        RentalDetail.findByPk.mockResolvedValue({ Rental: { RentalStatus: 'pending' } });
        await returnController.processReturn({ params: { rentalDetailId: 1 }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);

        // 409 Already returned
        RentalDetail.findByPk.mockResolvedValue({ Rental: { RentalStatus: 'completed' } });
        Return.findOne.mockResolvedValue({});
        await returnController.processReturn({ params: { rentalDetailId: 1 }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(409);

        // 500 Catch block
        RentalDetail.findByPk.mockRejectedValue(new Error('fail'));
        await returnController.processReturn({ params: { rentalDetailId: 1 }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
