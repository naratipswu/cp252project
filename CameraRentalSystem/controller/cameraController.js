const { cameras, bookings, persistData } = require('../model/data');
const crypto = require('crypto');

function getDateOrNull(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

function hasDateOverlap(startA, endA, startB, endB) {
    return startA <= endB && startB <= endA;
}

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
    const { cameraId, startDate, endDate } = req.body;
    const normalizedCameraId = Number(cameraId);
    const camera = cameras.find((c) => c.id === normalizedCameraId);
    if (!camera) return res.status(404).send('Camera not found');

    const start = getDateOrNull(startDate);
    const end = getDateOrNull(endDate);
    if (!start || !end || start > end) {
        return res.status(400).send('Invalid booking dates');
    }

    if (camera.stock <= 0) {
        return res.status(400).send('Camera is out of stock');
    }

    const isOverlap = bookings.some((booking) => {
        if (booking.cameraId !== camera.id) return false;
        const bookedStart = getDateOrNull(booking.startDate);
        const bookedEnd = getDateOrNull(booking.endDate);
        if (!bookedStart || !bookedEnd) return false;
        return hasDateOverlap(start, end, bookedStart, bookedEnd);
    });
    if (isOverlap) {
        return res.status(409).send('Selected camera is already booked for these dates');
    }

    const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = rentalDays * camera.pricePerDay;

    camera.stock -= 1;

    bookings.push({
        id: crypto.randomUUID(),
        cameraId: camera.id,
        cameraModel: camera.model,
        user: req.session.user.username,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        totalPrice
    });
    persistData();

    res.redirect('/browse');
};

exports.showAdminDashboard = (req, res) => {
    res.render('admin', { bookings, user: req.session.user });
};
