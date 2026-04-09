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

function isBlockingBooking(booking) {
    return booking.paymentStatus !== 'cancelled';
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

    const overlappingBookingCount = bookings.filter((booking) => {
        if (booking.cameraId !== camera.id) return false;
        if (!isBlockingBooking(booking)) return false;
        const bookedStart = getDateOrNull(booking.startDate);
        const bookedEnd = getDateOrNull(booking.endDate);
        if (!bookedStart || !bookedEnd) return false;
        return hasDateOverlap(start, end, bookedStart, bookedEnd);
    }).length;

    if (overlappingBookingCount >= camera.stock) {
        return res.status(409).send('Selected camera is already booked for these dates');
    }

    const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = rentalDays * camera.pricePerDay;

    bookings.push({
        id: crypto.randomUUID(),
        cameraId: camera.id,
        cameraModel: camera.model,
        user: req.session.user.username,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        totalPrice,
        bookingStatus: 'awaiting_confirmation',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString()
    });
    persistData();

    res.redirect(`/booking/${bookings[bookings.length - 1].id}/confirm`);
};

exports.showAdminDashboard = (req, res) => {
    res.render('admin', { bookings, user: req.session.user });
};

exports.showBookingConfirm = (req, res) => {
    const { bookingId } = req.params;
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return res.status(404).send('Booking not found');
    if (booking.user !== req.session.user.username && req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }

    const camera = cameras.find((item) => item.id === booking.cameraId);
    if (!camera) return res.status(404).send('Camera not found');

    res.render('booking_confirm', {
        booking,
        camera
    });
};

exports.confirmBooking = (req, res) => {
    const { bookingId } = req.params;
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return res.status(404).send('Booking not found');
    if (booking.user !== req.session.user.username && req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }

    if (booking.bookingStatus !== 'awaiting_confirmation' || booking.paymentStatus !== 'unpaid') {
        return res.status(409).send('Booking cannot be confirmed from its current state');
    }

    booking.bookingStatus = 'confirmed';
    persistData();
    res.redirect(`/booking/${booking.id}/payment`);
};

exports.showPaymentPage = (req, res) => {
    const { bookingId } = req.params;
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return res.status(404).send('Booking not found');
    if (booking.user !== req.session.user.username && req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }

    res.render('payment', {
        booking
    });
};

exports.confirmPayment = (req, res) => {
    const { bookingId } = req.params;
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return res.status(404).send('Booking not found');
    if (booking.user !== req.session.user.username && req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }

    if (booking.bookingStatus !== 'confirmed' || booking.paymentStatus !== 'unpaid') {
        return res.status(409).send('Payment cannot be confirmed from its current state');
    }

    booking.paymentStatus = 'paid';
    booking.bookingStatus = 'completed';
    booking.paidAt = new Date().toISOString();
    persistData();

    res.render('payment_success', { booking });
};
