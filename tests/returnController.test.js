const returnController = require('../CameraRentalSystem/controller/returnController');
const { Customer, Equipment, Rental, RentalDetail, Return, SyncLog } = require('../models');
const sequelize = require('../config/db');

jest.mock('../models', () => ({
    Customer: { findByPk: jest.fn() },
    Equipment: { findByPk: jest.fn() },
    Rental: { findByPk: jest.fn() },
    RentalDetail: { findAll: jest.fn(), findByPk: jest.fn() },
    Return: { findOne: jest.fn(), create: jest.fn() },
    SyncLog: { create: jest.fn() }
}));

jest.mock('../config/db', () => ({
    transaction: jest.fn((options, callback) => {
        if (typeof options === 'function') return options({ LOCK: { UPDATE: 'UPDATE' } });
        return callback({ LOCK: { UPDATE: 'UPDATE' } });
    })
}));

describe('ReturnController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { session: { user: { role: 'admin' } }, params: {}, body: {} };
        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    test('showAdminReturns success', async () => {
        RentalDetail.findAll.mockResolvedValue([
            { RentalDetailID: 1, Rental: { RentalID: 1, TotalAmount: 100, Customer: { Username: 'u' } }, Equipment: { Brand: 'B', ModelName: 'M' }, Return: null }
        ]);
        await returnController.showAdminReturns(req, res);
        expect(res.render).toHaveBeenCalledWith('admin_returns', expect.anything());
    });

    test('showAdminReturns failure', async () => {
        RentalDetail.findAll.mockRejectedValue(new Error('DB Error'));
        await returnController.showAdminReturns(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('processReturn success', async () => {
        req.params.rentalDetailId = '1';
        RentalDetail.findByPk.mockResolvedValue({ EquipmentID: 1, Rental: { RentalStatus: 'completed' } });
        Return.findOne.mockResolvedValue(null);
        Equipment.findByPk.mockResolvedValue({ save: jest.fn() });

        await returnController.processReturn(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/admin/returns');
    });

    test('processReturn fails if detail not found', async () => {
        req.params.rentalDetailId = '1';
        RentalDetail.findByPk.mockResolvedValue(null);

        await returnController.processReturn(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('processReturn fails if rental not completed', async () => {
        req.params.rentalDetailId = '1';
        RentalDetail.findByPk.mockResolvedValue({ EquipmentID: 1, Rental: { RentalStatus: 'pending' } });

        await returnController.processReturn(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('processReturn fails if already returned', async () => {
        req.params.rentalDetailId = '1';
        RentalDetail.findByPk.mockResolvedValue({ EquipmentID: 1, Rental: { RentalStatus: 'completed' } });
        Return.findOne.mockResolvedValue({ ReturnID: 1 });

        await returnController.processReturn(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });

    test('processReturn generic failure', async () => {
        req.params.rentalDetailId = '1';
        RentalDetail.findByPk.mockRejectedValue(new Error('Fatal'));

        await returnController.processReturn(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(SyncLog.create).toHaveBeenCalled();
    });
});
