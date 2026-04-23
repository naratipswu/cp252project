const path = require('path');

let cameraController;
let Rental, Customer, Payment, RentalDetail, Equipment, Category, db, cameraStore;

describe('CameraController 100% Coverage Suite', () => {
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
                return cb({
                    LOCK: { UPDATE: 'UPDATE' },
                    commit: jest.fn(),
                    rollback: jest.fn()
                });
            }),
            LOCK: { UPDATE: 'UPDATE' }
        }));

        const createMock = () => ({
            findAll: jest.fn().mockResolvedValue([]),
            findByPk: jest.fn().mockResolvedValue({}),
            findOne: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue([1]),
            destroy: jest.fn().mockResolvedValue(1),
            save: jest.fn(function () { return Promise.resolve(this); }),
            toJSON: jest.fn(function () { return this; })
        });

        jest.doMock(modelsPath, () => ({
            Customer: createMock(),
            Equipment: createMock(),
            Rental: createMock(),
            RentalDetail: createMock(),
            Payment: createMock(),
            Category: createMock(),
            Op: { ne: 'ne' }
        }));

        jest.doMock(storePath, () => ({
            getAllCameras: jest.fn().mockResolvedValue([]),
            addCamera: jest.fn().mockResolvedValue({}),
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
        cameraStore = require(storePath);
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

    describe('browseCameras', () => {
        test('covers filtering and grouping logic', async () => {
            const res = createResponse();
            Category.findAll.mockResolvedValue([{ CategoryID: 1, CategoryName: 'DSLR' }]);
            cameraStore.getAllCameras.mockResolvedValue([
                { id: 1, brand: 'Canon', model: 'EOS R5', status: 'available', pricePerDay: 100, categoryName: 'DSLR' },
                { id: 2, brand: 'Canon', model: 'EOS R5', status: 'maintenance', pricePerDay: 100, categoryName: 'DSLR' },
                { id: 3, brand: 'Sony', model: 'A7IV', status: 'available', pricePerDay: 150, categoryName: 'Mirrorless' }
            ]);

            const req = {
                query: {
                    search: 'DSLR',
                    type: 'digital',
                    minPrice: '50',
                    maxPrice: '200'
                },
                session: { user: { username: 'test' } }
            };

            await cameraController.browseCameras(req, res);
            expect(res.render).toHaveBeenCalled();
        });

        test('covers film type filtering and grouping edge cases', async () => {
            const res = createResponse();
            cameraStore.getAllCameras.mockResolvedValue([
                { id: 1, brand: 'Kodak', model: 'FunSaver', status: 'maintenance', pricePerDay: 10 },
                { id: 2, brand: 'Kodak', model: 'FunSaver', status: 'available', pricePerDay: 10 },
                { id: 3, brand: 'Sony', model: 'Digital', status: 'available', pricePerDay: 100 }
            ]);
            await cameraController.browseCameras({ query: { type: 'film' }, session: {} }, res);
            await cameraController.browseCameras({ query: { type: 'digital' }, session: {} }, res);
            await cameraController.browseCameras({ query: { type: 'other' }, session: {} }, res);
            expect(res.render).toHaveBeenCalled();
        });
    });

    describe('addCamera', () => {
        test('success paths', async () => {
            const res = createResponse();
            await cameraController.addCamera({ body: { brand: 'Nikon', model: 'Z9', stock: '5', pricePerDay: '200', categoryId: '1' }, file: { filename: 'nikon.jpg' } }, res);
            await cameraController.addCamera({ body: { brand: 'Nikon', model: 'Z9', stock: '5', pricePerDay: '200', imageUrl: 'http://img' } }, res);
            expect(res.redirect).toHaveBeenCalledTimes(2);
        });

        test('validation errors', async () => {
            const res = createResponse();
            await cameraController.addCamera({ body: {} }, res);
            await cameraController.addCamera({ body: { brand: 'a', model: 'b', stock: 'x' } }, res);
            await cameraController.addCamera({ body: { brand: 'a', model: 'b', stock: '1', pricePerDay: '-1' } }, res);
            expect(res.status).toHaveBeenCalledTimes(3);
        });
    });

    describe('admin operations', () => {
        test('showAdminCameras success and fail', async () => {
            const res = createResponse();
            Equipment.findAll.mockResolvedValue([{ EquipmentID: 1, Category: {} }]);
            await cameraController.showAdminCameras({ session: {}, query: { error: 'err' } }, res);

            Equipment.findAll.mockRejectedValue(new Error('DB Error'));
            await cameraController.showAdminCameras({ session: {}, query: {} }, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        test('toggleCameraStatus success and errors', async () => {
            const res = createResponse();
            await cameraController.toggleCameraStatus({ params: { id: '1' }, body: { status: 'available' } }, res);

            const mockCam = { save: jest.fn() };
            Equipment.findByPk.mockResolvedValue(mockCam);
            await cameraController.toggleCameraStatus({ params: { id: '1' }, body: { status: 'maintenance' } }, res);
            expect(mockCam.Status).toBe('maintenance');
        });

        test('deleteCamera success and errors', async () => {
            const res = createResponse();
            const mockCam = { destroy: jest.fn() };
            Equipment.findByPk.mockResolvedValue(mockCam);
            await cameraController.deleteCamera({ params: { id: '1' } }, res);
            expect(res.redirect).toHaveBeenCalled();

            mockCam.destroy.mockRejectedValue(new Error('Conflict'));
            await cameraController.deleteCamera({ params: { id: '1' } }, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });
    });

    describe('booking and payment', () => {
        test('bookCamera happy path', async () => {
            const res = createResponse();
            const mockCam = { Status: 'available', DailyRate: 100, EquipmentID: 1, save: jest.fn() };
            Equipment.findByPk.mockResolvedValue(mockCam);
            Customer.findOne.mockResolvedValue({ CustomerID: 1, Username: 'me' });
            Rental.create.mockResolvedValue({ RentalID: 10 });

            await cameraController.bookCamera({
                body: { cameraId: '1', startDate: '2024-01-01', endDate: '2024-01-05' },
                session: { user: { username: 'me' } }
            }, res);
            expect(res.redirect).toHaveBeenCalledWith('/cart');
        });

        test('bookCamera error cases', async () => {
            const res = createResponse();
            await cameraController.bookCamera({ body: { cameraId: '0', startDate: '2024-01-01', endDate: '2024-01-02' }, session: {} }, res);
            expect(res.status).toHaveBeenCalledWith(400);

            // Camera not found
            Equipment.findByPk.mockResolvedValue(null);
            await cameraController.bookCamera({ body: { cameraId: '1', startDate: '2024-01-01', endDate: '2024-01-02' }, session: { user: { username: 'u' } } }, res);
            expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Camera%20not%20found'));

            // Out of stock
            Equipment.findByPk.mockResolvedValue({ Status: 'rented' });
            await cameraController.bookCamera({ body: { cameraId: '1', startDate: '2024-01-01', endDate: '2024-01-02' }, session: { user: { username: 'u' } } }, res);
            expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Camera%20is%20out%20of%20stock'));

            // Unauthorized
            Equipment.findByPk.mockResolvedValue({ Status: 'available' });
            await cameraController.bookCamera({ body: { cameraId: '1', startDate: '2024-01-01', endDate: '2024-01-02' }, session: {} }, res);
            expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Unauthorized'));

            const err = new Error('Generic');
            Equipment.findByPk.mockRejectedValue(err);
            await cameraController.bookCamera({ body: { cameraId: '1', startDate: '2024-01-01', endDate: '2024-01-02' }, session: {} }, res);
            expect(res.redirect).toHaveBeenCalled();
        });

        test('showAdminDashboard success/fail', async () => {
            const res = createResponse();
            RentalDetail.findAll.mockResolvedValue([
                {
                    Rental: { RentalID: 1, Customer: { Username: 'u', Email: 'e' }, TotalAmount: 100 },
                    Equipment: { Brand: 'B', ModelName: 'M' },
                    StartDate: 'S', EndDate: 'E',
                    toJSON: function () { return this; }
                }
            ]);
            await cameraController.showAdminDashboard({ session: {} }, res);
            
            RentalDetail.findAll.mockRejectedValue(new Error('Fail'));
            await cameraController.showAdminDashboard({ session: {} }, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        test('showBookingConfirm success/fail paths', async () => {
            const res = createResponse();
            Rental.findByPk.mockResolvedValue({ CustomerID: 1, RentalStatus: 'pending', RentalID: 1, TotalAmount: 100 });
            Customer.findByPk.mockResolvedValue({ Username: 'me' });
            RentalDetail.findOne.mockResolvedValue({ EquipmentID: 1, StartDate: 'S', EndDate: 'E' });
            cameraStore.getAllCameras.mockResolvedValue([{ id: 1, model: 'M' }]);

            await cameraController.showBookingConfirm({ params: { bookingId: '1' }, session: { user: { username: 'me' } } }, res);
            
            // statuses coverage
            const statuses = ['active', 'cancelled', 'completed'];
            for (const s of statuses) {
                Rental.findByPk.mockResolvedValue({ CustomerID: 1, RentalStatus: s, RentalID: 1 });
                await cameraController.showBookingConfirm({ params: { bookingId: '1' }, session: { user: { username: 'me' } } }, res);
            }

            // Forbidden
            Customer.findByPk.mockResolvedValue({ Username: 'other' });
            await cameraController.showBookingConfirm({ params: { bookingId: '1' }, session: { user: { username: 'me', role: 'user' } } }, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('confirmBooking success/fail', async () => {
            const res = createResponse();
            const mockRental = { RentalStatus: 'pending', save: jest.fn(), CustomerID: 1 };
            Rental.findByPk.mockResolvedValue(mockRental);
            Customer.findByPk.mockResolvedValue({ Username: 'me' });
            Payment.findOne.mockResolvedValue(null);
            
            await cameraController.confirmBooking({ params: { bookingId: '1' }, session: { user: { username: 'me' } } }, res);
            
            // Already confirmed
            mockRental.RentalStatus = 'active';
            await cameraController.confirmBooking({ params: { bookingId: '1' }, session: { user: { username: 'me' } } }, res);
            expect(res.redirect).toHaveBeenCalled();

            // Forbidden
            Customer.findByPk.mockResolvedValue({ Username: 'other' });
            await cameraController.confirmBooking({ params: { bookingId: '1' }, session: { user: { username: 'me', role: 'user' } } }, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('showPaymentPage success/fail', async () => {
            const res = createResponse();
            Rental.findByPk.mockResolvedValue({ CustomerID: 1, TotalAmount: 100 });
            Customer.findByPk.mockResolvedValue({ Username: 'me' });
            Payment.findOne.mockResolvedValue(null);
            await cameraController.showPaymentPage({ params: { bookingId: '1' }, session: { user: { username: 'me' } } }, res);
            
            Payment.findOne.mockResolvedValue({ PaymentStatus: 'pending' });
            await cameraController.showPaymentPage({ params: { bookingId: '1' }, session: { user: { username: 'me' } } }, res);
            expect(res.status).toHaveBeenCalledWith(409);

            Payment.findOne.mockResolvedValue({ PaymentStatus: 'approved' });
            await cameraController.showPaymentPage({ params: { bookingId: '1' }, session: { user: { username: 'me' } } }, res);
            expect(res.status).toHaveBeenCalledWith(409);

            // Forbidden
            Customer.findByPk.mockResolvedValue({ Username: 'other' });
            await cameraController.showPaymentPage({ params: { bookingId: '1' }, session: { user: { username: 'me', role: 'user' } } }, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('confirmPayment success/fail paths', async () => {
            const res = createResponse();
            const mockRental = { CustomerID: 1, RentalStatus: 'active', TotalAmount: 100, RentalID: 1 };
            Rental.findByPk.mockResolvedValue(mockRental);
            Customer.findByPk.mockResolvedValue({ Username: 'me' });
            Payment.findOne.mockResolvedValue(null);
            await cameraController.confirmPayment({ params: { bookingId: '1' }, session: { user: { username: 'me' } }, file: { filename: 'f' } }, res);
            
            // Invalid status
            mockRental.RentalStatus = 'pending';
            await cameraController.confirmPayment({ params: { bookingId: '1' }, session: { user: { username: 'me' } }, file: { filename: 'f' } }, res);
            expect(res.status).toHaveBeenCalledWith(409);

            // Forbidden
            Customer.findByPk.mockResolvedValue({ Username: 'other' });
            await cameraController.confirmPayment({ params: { bookingId: '1' }, session: { user: { username: 'me', role: 'user' } }, file: { filename: 'f' } }, res);
            expect(res.status).toHaveBeenCalledWith(403);

            // Missing file
            Customer.findByPk.mockResolvedValue({ Username: 'me' });
            mockRental.RentalStatus = 'active';
            await cameraController.confirmPayment({ params: { bookingId: '1' }, session: { user: { username: 'me' } }, file: null }, res);
            expect(res.status).toHaveBeenCalledWith(400);

            // Unique constraint error
            db.transaction.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
            await cameraController.confirmPayment({ params: { bookingId: '1' }, session: { user: { username: 'me' } }, file: { filename: 'f' } }, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });

        test('showAdminPaymentSlips with data', async () => {
            const res = createResponse();
            Payment.findAll.mockResolvedValue([
                { 
                    PaymentID: 1, Rental: { RentalID: 1, Customer: { Username: 'u' }, RentalDetails: [{ StartDate: '2024', Equipment: { Brand: 'B', ModelName: 'M' } }] } 
                },
                {
                    PaymentID: 2, Rental: { RentalID: 2, Customer: { Username: 'u2' }, RentalDetails: [] }
                }
            ]);
            await cameraController.showAdminPaymentSlips({ session: {} }, res);
            expect(res.render).toHaveBeenCalledWith('admin_payment_slips', expect.any(Object));
        });

        test('approvePaymentSlip success/fail', async () => {
            const res = createResponse();
            const mockP = { PaymentStatus: 'pending', RentalID: 1, save: jest.fn() };
            const mockR = { RentalStatus: 'active', save: jest.fn() };
            Payment.findByPk.mockResolvedValue(mockP);
            Rental.findByPk.mockResolvedValue(mockR);
            await cameraController.approvePaymentSlip({ params: { paymentId: '1' } }, res);
            
            // Not pending
            mockP.PaymentStatus = 'approved';
            await cameraController.approvePaymentSlip({ params: { paymentId: '1' } }, res);
            expect(res.status).toHaveBeenCalledWith(409);

            // Invalid ID
            await cameraController.approvePaymentSlip({ params: { paymentId: 'abc' } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('rejectPaymentSlip branches', async () => {
            const res = createResponse();
            const mockP = { PaymentStatus: 'pending', save: jest.fn(), RentalID: 1 };
            const mockR = { RentalStatus: 'completed', save: jest.fn() };
            Payment.findByPk.mockResolvedValue(mockP);
            Rental.findByPk.mockResolvedValue(mockR);
            await cameraController.rejectPaymentSlip({ params: { paymentId: '1' } }, res);
            expect(mockR.RentalStatus).toBe('active');

            // Not pending
            mockP.PaymentStatus = 'approved';
            await cameraController.rejectPaymentSlip({ params: { paymentId: '1' } }, res);
            expect(res.status).toHaveBeenCalledWith(409);

            // Invalid ID
            await cameraController.rejectPaymentSlip({ params: { paymentId: '0' } }, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('getBookedDates success/fail', async () => {
            const res = createResponse();
            RentalDetail.findAll.mockResolvedValue([{ StartDate: '2024-01-01', EndDate: '2024-01-02' }]);
            await cameraController.getBookedDates({ params: { cameraId: '1' } }, res);
            
            RentalDetail.findAll.mockRejectedValue(new Error('Fail'));
            await cameraController.getBookedDates({ params: { cameraId: '1' } }, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});