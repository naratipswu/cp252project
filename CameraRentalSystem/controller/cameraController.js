const { cameras, bookings } = require('../model/data');

exports.browseCameras = (req, res) => {
    const searchQuery = req.query.search || '';
    
    // Filter by brand or model
    let filteredCameras = cameras;
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredCameras = cameras.filter(c => 
            c.brand.toLowerCase().includes(lowerQuery) || 
            c.model.toLowerCase().includes(lowerQuery)
        );
    }

    res.render('browse_camera', { 
        cameras: filteredCameras, 
        user: req.session.user,
        searchQuery
    });
};

exports.bookCamera = (req, res) => {
    const { cameraId, startDate, endDate, totalPrice } = req.body;
    
    const camera = cameras.find(c => c.id == cameraId);
    if (!camera) return res.status(404).send('Camera not found');

    // Allow overbooking per req 5, but let's reduce displayed stock just for realism if stock > 0
    if (camera.stock > 0) {
        camera.stock -= 1;
    }

    // Save booking
    bookings.push({
        id: Date.now(),
        cameraId: camera.id,
        cameraModel: camera.model,
        user: req.session.user.username,
        startDate,
        endDate,
        totalPrice
    });

    res.redirect('/browse');
};

exports.showAdminDashboard = (req, res) => {
    res.render('admin', { bookings, user: req.session.user });
};
