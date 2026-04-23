const logController = require('../CameraRentalSystem/controller/logController');
const { SyncLog } = require('../models');

jest.mock('../models', () => ({
    SyncLog: {
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

describe('LogController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('showAdminLogs', () => {
        test('should render admin_logs with data', async () => {
            const req = { session: { user: { username: 'admin' } } };
            const res = createResponse();

            const mockLog = {
                SyncLogID: 1,
                Source: 'Manual Sync',
                Status: 'success',
                Message: 'Sync completed',
                SyncedAt: new Date()
            };
            SyncLog.findAll.mockResolvedValue([mockLog]);

            await logController.showAdminLogs(req, res);

            expect(res.renderedView.view).toBe('admin_logs');
            expect(res.renderedView.data.logs.length).toBe(1);
            expect(res.renderedView.data.logs[0].source).toBe('Manual Sync');
        });

        test('should handle errors and return 500', async () => {
            const req = { session: { user: { username: 'admin' } } };
            const res = createResponse();

            SyncLog.findAll.mockRejectedValue(new Error('Fetch failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await logController.showAdminLogs(req, res);

            expect(res.statusCode).toBe(500);
            expect(res.message).toBe('Failed to load system logs dashboard');

            consoleSpy.mockRestore();
        });
    });
});
