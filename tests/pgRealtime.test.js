const { registerPgRealtimeRoutes } = require('../CameraRentalSystem/service/pgRealtime');

const mockPool = {
    query: jest.fn(),
    end: jest.fn().mockResolvedValue()
};

jest.mock('pg', () => {
    return { Pool: jest.fn(() => mockPool) };
});

describe('PgRealtime Service Coverage', () => {
    let app;
    let requireAdmin;

    beforeEach(() => {
        jest.clearAllMocks();
        app = { get: jest.fn() };
        requireAdmin = jest.fn((req, res, next) => next());
        process.env.ENABLE_PG_REALTIME = 'true';
    });

    test('should do nothing if disabled', () => {
        process.env.ENABLE_PG_REALTIME = 'false';
        registerPgRealtimeRoutes(app, requireAdmin);
        expect(app.get).not.toHaveBeenCalled();
    });

    test('should throw if requireAdmin missing', () => {
        expect(() => registerPgRealtimeRoutes(app, null)).toThrow('admin middleware');
    });

    test('rate limit functionality and cleanup', async () => {
        registerPgRealtimeRoutes(app, requireAdmin);
        const rateLimit = app.get.mock.calls[0][2];
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        // 1. Trigger rate limit error (429)
        const req = { ip: '1.1.1.1' };
        for (let i = 0; i < 60; i++) {
            rateLimit(req, res, next);
        }
        expect(next).toHaveBeenCalledTimes(60);
        rateLimit(req, res, next);
        expect(res.status).toHaveBeenCalledWith(429);

        // 2. Trigger cleanup loop and deletion (line 42)
        const realDateNow = Date.now;
        
        // Add 501 entries from an "old" minute
        const oldTime = 1000 * 60000;
        Date.now = jest.fn(() => oldTime);
        for (let i = 0; i < 501; i++) {
            rateLimit({ ip: `10.0.0.${i}` }, res, next);
        }

        // Now add one entry from a "new" minute to trigger cleanup of the 501 old ones
        const newTime = 1005 * 60000;
        Date.now = jest.fn(() => newTime);
        rateLimit({ ip: '20.0.0.1' }, res, next);

        Date.now = realDateNow;
    });

    test('health endpoint paths', async () => {
        registerPgRealtimeRoutes(app, requireAdmin);
        const handler = app.get.mock.calls.find(c => c[0] === '/api/sql/health')[3];
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        mockPool.query.mockResolvedValue({ rows: [{ server_time: '2024-01-01' }] });
        await handler({}, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));

        mockPool.query.mockRejectedValue(new Error('Connect fail'));
        await handler({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('revenue report success/fail', async () => {
        registerPgRealtimeRoutes(app, requireAdmin);
        const handler = app.get.mock.calls.find(c => c[0] === '/api/sql/revenue-daily')[3];
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        mockPool.query.mockResolvedValue({ rows: [{ pay_day: '2024-01-01', total_revenue: 100 }] });
        await handler({}, res);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));

        mockPool.query.mockRejectedValue(new Error('SQL Fail'));
        await handler({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('active rentals success/fail', async () => {
        registerPgRealtimeRoutes(app, requireAdmin);
        const handler = app.get.mock.calls.find(c => c[0] === '/api/sql/active-rentals')[3];
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        mockPool.query.mockResolvedValue({ rows: [{ RentalID: 1 }] });
        await handler({}, res);
        expect(res.json).toHaveBeenCalledWith(expect.any(Array));

        mockPool.query.mockRejectedValue(new Error('SQL Fail'));
        await handler({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('SIGINT handler', async () => {
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        registerPgRealtimeRoutes(app, requireAdmin);
        
        const sigintListener = process.listeners('SIGINT').pop();
        if (sigintListener) {
            await sigintListener();
            expect(mockPool.end).toHaveBeenCalled();
            expect(exitSpy).toHaveBeenCalledWith(0);
        }
        exitSpy.mockRestore();
    });
});
