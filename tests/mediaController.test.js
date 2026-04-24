const mediaController = require('../CameraRentalSystem/controller/mediaController');
// const { UPLOAD_CATEGORIES, getDirectoryStructure } = require('../CameraRentalSystem/service/uploadService');
const { getAllCameras } = require('../CameraRentalSystem/service/cameraStore');
const Equipment = require('../models/equipment');

jest.mock('../CameraRentalSystem/service/uploadService', () => ({
    UPLOAD_CATEGORIES: ['products', 'others'],
    getDirectoryStructure: jest.fn().mockReturnValue('mock structure')
}));

jest.mock('../CameraRentalSystem/service/cameraStore', () => ({
    getAllCameras: jest.fn()
}));

jest.mock('../models/equipment', () => ({
    update: jest.fn().mockResolvedValue([1])
}));

describe('MediaController Max Coverage', () => {
    let res;
    beforeEach(() => {
        jest.resetAllMocks();
        getAllCameras.mockResolvedValue([{ EquipmentID: 1, ModelName: 'Cam1' }]);
        res = {
            render: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        console.error = jest.fn();
    });

    test('showMediaManager success and catch', async () => {
        await mediaController.showMediaManager({}, res);
        expect(res.render).toHaveBeenCalled();

        getAllCameras.mockRejectedValue(new Error('fail'));
        await mediaController.showMediaManager({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('uploadMedia branches', async () => {
        // Missing file
        await mediaController.uploadMedia({ body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);

        // Success - invalid category
        await mediaController.uploadMedia({ 
            body: { category: 'invalid' }, 
            file: { filename: 'f.jpg' } 
        }, res);
        expect(res.render).toHaveBeenCalledWith('admin_media', expect.objectContaining({ uploaded: '/uploads/others/f.jpg' }));

        // Success - products category, valid ID
        await mediaController.uploadMedia({ 
            body: { category: 'products', cameraId: '1' }, 
            file: { filename: 'p.jpg' } 
        }, res);
        expect(Equipment.update).toHaveBeenCalled();

        // Success - products category, invalid ID
        await mediaController.uploadMedia({ 
            body: { category: 'products', cameraId: '0' }, 
            file: { filename: 'p2.jpg' } 
        }, res);
    });

    test('uploadMedia catch path', async () => {
        getAllCameras.mockRejectedValue(new Error('fatal'));
        await mediaController.uploadMedia({}, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
