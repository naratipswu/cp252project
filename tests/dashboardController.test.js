const dashboardController = require('../CameraRentalSystem/controller/dashboardController');
const { Payment, RentalDetail } = require('../models');

jest.mock('../models', () => ({
    Payment: {
        sum: jest.fn(),
        count: jest.fn()
    },
    Rental: {
        findAll: jest.fn()
    },
    RentalDetail: {
        count: jest.fn(),
        findAll: jest.fn()
    },
    Customer: {
        findOne: jest.fn()
    },
    Equipment: {
        findAll: jest.fn()
    }
}));

function createResponse() {
    return {
        statusCode: 200,
        renderedView: null,
        message: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(msg) {
            this.message = msg;
            return this;
        },
        render(view, data) {
            this.renderedView = { view, data };
            return this;
        }
    };
}

describe('DashboardController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('showDashboard', () => {
        test('should render admin dashboard with stats and recent bookings', async () => {
            const req = { session: { user: { username: 'admin', role: 'admin' } } };
            const res = createResponse();

            Payment.sum.mockResolvedValue(15000); // monthlyIncome
            RentalDetail.count.mockResolvedValueOnce(5); // deliveriesToday
            RentalDetail.count.mockResolvedValueOnce(3); // returnsToday
            Payment.count.mockResolvedValue(2); // pendingPayments

            const mockBookingRow = {
                toJSON: () => ({
                    Rental: {
                        RentalID: 101,
                        TotalAmount: 2500.00,
                        Customer: { Email: 'user@example.com' }
                    },
                    Equipment: { Brand: 'Canon', ModelName: 'EOS R5' },
                    StartDate: '2026-08-01',
                    EndDate: '2026-08-05'
                })
            };
            RentalDetail.findAll.mockResolvedValue([mockBookingRow]);

            await dashboardController.showDashboard(req, res);

            expect(res.renderedView.view).toBe('admin');
            expect(res.renderedView.data.stats.monthlyIncome).toBe(15000);
            expect(res.renderedView.data.stats.deliveriesToday).toBe(5);
            expect(res.renderedView.data.stats.returnsToday).toBe(3);
            expect(res.renderedView.data.stats.pendingPayments).toBe(2);
            expect(res.renderedView.data.bookings.length).toBe(1);
            expect(res.renderedView.data.bookings[0].user).toBe('user@example.com');
        });

        test('should use username if email is missing in recent bookings', async () => {
            const req = { session: { user: { username: 'admin' } } };
            const res = createResponse();

            Payment.sum.mockResolvedValue(0);
            RentalDetail.count.mockResolvedValue(0);
            Payment.count.mockResolvedValue(0);

            const mockBookingRow = {
                toJSON: () => ({
                    Rental: {
                        RentalID: 102,
                        TotalAmount: 1000,
                        Customer: { Email: null, Username: 'user_nick' }
                    },
                    Equipment: { Brand: 'Nikon', ModelName: 'Z6' },
                    StartDate: '2026-08-10',
                    EndDate: '2026-08-12'
                })
            };
            RentalDetail.findAll.mockResolvedValue([mockBookingRow]);

            await dashboardController.showDashboard(req, res);

            expect(res.renderedView.data.bookings[0].user).toBe('user_nick');
        });

        test('should handle errors and return 500', async () => {
            const req = { session: { user: { username: 'admin' } } };
            const res = createResponse();

            Payment.sum.mockRejectedValue(new Error('DB Error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await dashboardController.showDashboard(req, res);

            expect(res.statusCode).toBe(500);
            expect(res.message).toBe('Failed to load dashboard');
            
            consoleSpy.mockRestore();
        });
    });
});
