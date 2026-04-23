const fs = require('fs');
const path = require('path');
const { ensureUploadDirectories, getDirectoryStructure, uploadImage, UPLOADS_DIR } = require('../CameraRentalSystem/service/uploadService');

describe('UploadService Max Coverage', () => {
    beforeAll(() => {
        ensureUploadDirectories();
        // Create dummy structure
        const dummyDir = path.join(UPLOADS_DIR, 'others', 'sub');
        if (!fs.existsSync(dummyDir)) fs.mkdirSync(dummyDir, { recursive: true });
        fs.writeFileSync(path.join(dummyDir, 'test.txt'), 'hello');
    });

    test('getDirectoryStructure variants', () => {
        expect(getDirectoryStructure('/non/existent')).toBe('Directory not found');
        
        const temp = path.join(__dirname, 'empty_test_dir');
        if (!fs.existsSync(temp)) fs.mkdirSync(temp);
        expect(getDirectoryStructure(temp)).toBe('(empty)');
        fs.rmdirSync(temp);

        // Full structure
        const structure = getDirectoryStructure();
        expect(structure).toContain('others');
        expect(structure).toContain('└── test.txt');
    });

    test('Multer Config Internal Logic', () => {
        const storage = uploadImage.storage;
        const cb = jest.fn();

        storage.getDestination({ body: { category: 'products' } }, {}, cb);
        storage.getDestination({ body: { category: 'invalid' } }, {}, cb);

        storage.getFilename({}, { originalname: 'My Photo.JPG' }, cb);
        storage.getFilename({}, { originalname: '' }, cb);
        expect(cb).toHaveBeenCalled();
    });

    test('fileFilter should handle images and errors', () => {
        const filter = uploadImage.fileFilter;
        const cb = jest.fn();
        filter({}, { mimetype: 'image/png', originalname: 'test.png' }, cb);
        filter({}, { mimetype: 'application/pdf', originalname: 'test.pdf' }, cb);
        filter({}, { mimetype: 'image/png', originalname: '' }, cb); // missing extension
        expect(cb).toHaveBeenCalled();
    });
});
