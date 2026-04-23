const uploadService = require('../CameraRentalSystem/service/uploadService');
const fs = require('fs');
const path = require('path');

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn()
}));

describe('UploadService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('ensureUploadDirectories should create dirs', () => {
        fs.existsSync.mockReturnValue(false);
        uploadService.ensureUploadDirectories();
        expect(fs.mkdirSync).toHaveBeenCalled();
    });

    describe('getDirectoryStructure', () => {
        test('should return directory tree', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockImplementation((p) => {
                if (p.endsWith('uploads')) return ['file1.jpg', 'subdir'];
                return [];
            });
            fs.statSync.mockImplementation((p) => ({
                isDirectory: () => p.endsWith('subdir')
            }));

            const structure = uploadService.getDirectoryStructure();
            expect(structure).toContain('file1.jpg');
            expect(structure).toContain('subdir');
        });

        test('should return empty if no files', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue([]);
            const structure = uploadService.getDirectoryStructure();
            expect(structure).toBe('(empty)');
        });
    });

    describe('Multer Config Internal Logic', () => {
        test('fileFilter should handle images', () => {
            const filter = uploadService.uploadImage.fileFilter;
            const cb = jest.fn();
            filter({}, { originalname: 'test.jpg', mimetype: 'image/jpeg' }, cb);
            expect(cb).toHaveBeenCalledWith(null, true);
        });

        test('fileFilter should reject non-images', () => {
            const filter = uploadService.uploadImage.fileFilter;
            const cb = jest.fn();
            filter({}, { originalname: 'test.exe', mimetype: 'application/octet-stream' }, cb);
            expect(cb).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
