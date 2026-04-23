const mediaController = require('../CameraRentalSystem/controller/mediaController');
const { UPLOAD_CATEGORIES, getDirectoryStructure } = require('../CameraRentalSystem/service/uploadService');
const { getAllCameras } = require('../CameraRentalSystem/service/cameraStore');
const Equipment = require('../models/equipment');

jest.mock('../CameraRentalSystem/service/uploadService', () => ({
    UPLOAD_CATEGORIES: ['products', 'others'],
    getDirectoryStructure: jest.fn().mockReturnValue({ products: [], others: [] })
}));

jest.mock('../CameraRentalSystem/service/cameraStore', () => ({
    getAllCameras: jest.fn()
}));

jest.mock('../models/equipment', () => ({
    update: jest.fn()
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

describe('MediaController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('showMediaManager', () => {
        test('should render admin_media', async () => {
            const req = {};
            const res = createResponse();
            getAllCameras.mockResolvedValue([{ EquipmentID: 1 }]);

            await mediaController.showMediaManager(req, res);

            expect(res.renderedView.view).toBe('admin_media');
            expect(res.renderedView.data.cameras.length).toBe(1);
        });

        test('should handle error in showMediaManager', async () => {
            const req = {};
            const res = createResponse();
            getAllCameras.mockRejectedValue(new Error('Fail'));

            await mediaController.showMediaManager(req, res);

            expect(res.statusCode).toBe(500);
            expect(res.message).toBe('Failed to load media manager');
        });
    });

    describe('uploadMedia', () => {
        test('should return 400 if no file uploaded', async () => {
            const req = { file: null };
            const res = createResponse();
            getAllCameras.mockResolvedValue([]);

            await mediaController.uploadMedia(req, res);

            expect(res.statusCode).toBe(400);
            expect(res.renderedView.data.error).toBe('Please select an image file.');
        });

        test('should upload successfully and update product if category is products', async () => {
            const req = {
                file: { filename: 'test.jpg' },
                body: { category: 'products', cameraId: '10' }
            };
            const res = createResponse();
            getAllCameras.mockResolvedValue([{ EquipmentID: 10 }]);

            await mediaController.uploadMedia(req, res);

            expect(Equipment.update).toHaveBeenCalledWith(
                { ImageURL: '/uploads/products/test.jpg' },
                { where: { EquipmentID: 10 } }
            );
            expect(res.renderedView.data.uploaded).toBe('/uploads/products/test.jpg');
        });

        test('should handle upload error', async () => {
            const req = { file: { filename: 'test.jpg' }, body: {} };
            const res = createResponse();
            getAllCameras.mockRejectedValue(new Error('Fatal'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await mediaController.uploadMedia(req, res);

            expect(res.statusCode).toBe(500);
            expect(res.message).toBe('Failed to upload media');
            consoleSpy.mockRestore();
        });
    });
});
