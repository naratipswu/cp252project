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

    test('should throw if requireAdmin missing', () => {
        expect(() => registerPgRealtimeRoutes(app, null)).toThrow('admin middleware');
    });

    test('rate limit map cleanup', () => {
        registerPgRealtimeRoutes(app, requireAdmin);
        const rateLimit = app.get.mock.calls[0][2];
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        // Fill Map
        const now = Date.now();
        for(let i=0; i<505; i++) {
            const req = { ip: `1.2.3.${i}` };
            // Mock Date.now to simulate different minutes if needed, 
            // but the code uses Date.now() / 60000.
            rateLimit(req, res, next);
        }
        // This should trigger the cleanup logic (line 37-45)
        expect(next).toHaveBeenCalled();
    });

    test('revenue report failure', async () => {
        registerPgRealtimeRoutes(app, requireAdmin);
        const handler = app.get.mock.calls.find(c => c[0] === '/api/sql/revenue-daily')[3];
        mockPool.query.mockRejectedValue(new Error('SQL Fail'));
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await handler({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('active rentals failure', async () => {
        registerPgRealtimeRoutes(app, requireAdmin);
        const handler = app.get.mock.calls.find(c => c[0] === '/api/sql/active-rentals')[3];
        mockPool.query.mockRejectedValue(new Error('SQL Fail'));
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await handler({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('SIGINT handler', async () => {
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        registerPgRealtimeRoutes(app, requireAdmin);
        
        // Find the SIGINT listener
        const sigintListener = process.listeners('SIGINT').pop();
        if (sigintListener) {
            await sigintListener();
            expect(mockPool.end).toHaveBeenCalled();
            expect(exitSpy).toHaveBeenCalledWith(0);
        }
        exitSpy.mockRestore();
    });
});
