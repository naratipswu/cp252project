const path = require('path');

let cameraController;
let Rental, Customer, Payment, RentalDetail, Equipment, Category, db;

describe('CameraController Ultimate Integrated Coverage', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        console.error = jest.fn();

        const root = path.resolve(__dirname, '..');
        const dbPath = path.resolve(root, 'config/db');
        const modelsPath = path.resolve(root, 'models');
        const storePath = path.resolve(root, 'CameraRentalSystem/service/cameraStore');

        jest.doMock(dbPath, () => ({
            transaction: jest.fn(async (opts, callback) => {
                const cb = typeof opts === 'function' ? opts : callback;
                return cb({ LOCK: { UPDATE: 'UPDATE' } });
            })
        }));

        jest.doMock(modelsPath, () => {
            const createMock = () => ({
                findAll: jest.fn().mockResolvedValue([]),
                findByPk: jest.fn().mockResolvedValue({}),
                findOne: jest.fn().mockResolvedValue({}),
                create: jest.fn().mockResolvedValue({}),
                update: jest.fn().mockResolvedValue([1]),
                destroy: jest.fn().mockResolvedValue(1),
                save: jest.fn(function() { return Promise.resolve(this); }),
                toJSON: jest.fn(function() { return this; })
            });
            return {
                Customer: createMock(),
                Equipment: createMock(),
                Rental: createMock(),
                RentalDetail: createMock(),
                Payment: createMock(),
                Category: createMock()
            };
        });

        jest.doMock(storePath, () => ({
            getAllCameras: jest.fn().mockResolvedValue([]),
            addCamera: jest.fn().mockResolvedValue({}),
            deleteCamera: jest.fn().mockResolvedValue(1),
            DEFAULT_IMAGE: 'default.jpg'
        }));

        db = require(dbPath);
        const models = require(modelsPath);
        Rental = models.Rental;
        Customer = models.Customer;
        Payment = models.Payment;
        RentalDetail = models.RentalDetail;
        Equipment = models.Equipment;
        Category = models.Category;
        cameraController = require('../CameraRentalSystem/controller/cameraController');
    });

    function createResponse() {
        return {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            render: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            statusCode: 200
        };
    }

    test('Success Paths Sweep', async () => {
        const res = createResponse();
        // 1. Browse
        Category.findAll.mockResolvedValue([]);
        await cameraController.browseCameras({ query: {}, session: {} }, res);
        // 2. Dashboard
        RentalDetail.findAll.mockResolvedValue([]);
        await cameraController.showAdminDashboard({ session: {} }, res);
        // 3. Book Success
        Equipment.findByPk.mockResolvedValue({ Status: 'available', DailyRate: 100, save: jest.fn() });
        Customer.findOne.mockResolvedValue({ CustomerID: 1 });
        await cameraController.bookCamera({ body: { cameraId: '1', startDate: '2024-01-01', endDate: '2024-01-02' }, session: { user: { username: 'u' } } }, res);
        // 4. Confirm Booking Success
        Rental.findByPk.mockResolvedValue({ RentalID: 1, RentalStatus: 'pending', save: jest.fn() });
        Customer.findByPk.mockResolvedValue({ Username: 'u' });
        await cameraController.confirmBooking({ params: { bookingId: '1' }, session: { user: { username: 'u' } } }, res);
        // 5. Payment Success
        Rental.findByPk.mockResolvedValue({ RentalID: 1, RentalStatus: 'active' });
        await cameraController.confirmPayment({ params: { bookingId: '1' }, file: { filename: 's.jpg' }, session: { user: { username: 'u' } } }, res);
        expect(res.redirect).toHaveBeenCalled();
    });

    test('Error Paths Sweep', async () => {
        const res = createResponse();
        // 1. Book Fail (400)
        await cameraController.bookCamera({ body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        // 2. Confirm Payment Fail (500)
        db.transaction.mockImplementationOnce(() => Promise.reject(new Error('Fatal')));
        await cameraController.confirmPayment({ params: { bookingId: '1' }, file: { filename: 's.jpg' }, session: { user: { username: 'u' } } }, res);
        expect(res.status).toHaveBeenCalledWith(500);
        // 3. Toggle Fail (404)
        Equipment.findByPk.mockResolvedValue(null);
        await cameraController.toggleCameraStatus({ params: { id: '999' } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('Admin Operations Sweep', async () => {
        const res = createResponse();
        // Payments
        RentalDetail.findAll.mockResolvedValue([]);
        await cameraController.showAdminPaymentSlips({ session: {} }, res);
        // Approve
        const mockP = { PaymentStatus: 'pending', RentalID: 1, save: jest.fn() };
        Payment.findByPk.mockResolvedValue(mockP);
        Rental.findByPk.mockResolvedValue({ save: jest.fn() });
        await cameraController.approvePaymentSlip({ params: { paymentId: '1' } }, res);
        expect(mockP.PaymentStatus).toBe('approved');
        // Dates
        RentalDetail.findAll.mockResolvedValue([]);
        await cameraController.getBookedDates({ params: { cameraId: '1' } }, res);
        expect(res.json).toHaveBeenCalled();
    });
});
