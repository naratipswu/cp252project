const { cameras, persistData } = require('../model/data');
const { UPLOAD_CATEGORIES } = require('../service/uploadService');

exports.showMediaManager = (req, res) => {
  res.render('admin_media', {
    categories: UPLOAD_CATEGORIES,
    cameras,
    uploaded: null,
    error: null
  });
};

exports.uploadMedia = (req, res) => {
  if (!req.file) {
    return res.status(400).render('admin_media', {
      categories: UPLOAD_CATEGORIES,
      cameras,
      uploaded: null,
      error: 'Please select an image file.'
    });
  }

  const category = UPLOAD_CATEGORIES.includes(req.body.category) ? req.body.category : 'others';
  const publicPath = `/uploads/${category}/${req.file.filename}`;
  const cameraId = Number(req.body.cameraId || 0);

  if (category === 'products' && cameraId > 0) {
    const camera = cameras.find((item) => item.id === cameraId);
    if (camera) {
      camera.image = publicPath;
      persistData();
    }
  }

  return res.render('admin_media', {
    categories: UPLOAD_CATEGORIES,
    cameras,
    uploaded: publicPath,
    error: null
  });
};
