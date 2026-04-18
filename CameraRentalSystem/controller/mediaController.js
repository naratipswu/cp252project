const { UPLOAD_CATEGORIES, getDirectoryStructure } = require('../service/uploadService');
const { getAllCameras } = require('../service/cameraStore');
const Equipment = require('../../models/equipment');

exports.showMediaManager = (req, res) => {
  return getAllCameras()
    .then((cameras) => res.render('admin_media', {
      categories: UPLOAD_CATEGORIES,
      cameras,
      uploaded: null,
      error: null,
      structure: getDirectoryStructure()
    }))
    .catch(() => res.status(500).send('Failed to load media manager'));
};

exports.uploadMedia = (req, res) => {
  return getAllCameras().then(async (cameras) => {
    if (!req.file) {
      return res.status(400).render('admin_media', {
        categories: UPLOAD_CATEGORIES,
        cameras,
        uploaded: null,
        error: 'Please select an image file.',
        structure: getDirectoryStructure()
      });
    }

    const category = UPLOAD_CATEGORIES.includes(req.body.category) ? req.body.category : 'others';
    const publicPath = `/uploads/${category}/${req.file.filename}`;
    const cameraId = Number(req.body.cameraId || 0);

    if (category === 'products' && cameraId > 0) {
      await Equipment.update({ ImageURL: publicPath }, { where: { EquipmentID: cameraId } });
    }

    const updatedCameras = await getAllCameras();
    return res.render('admin_media', {
      categories: UPLOAD_CATEGORIES,
      cameras: updatedCameras,
      uploaded: publicPath,
      error: null,
      structure: getDirectoryStructure()
    });
  }).catch((err) => {
    console.error('Upload Error:', err);
    res.status(500).send('Failed to upload media');
  });
};
