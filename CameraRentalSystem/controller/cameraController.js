const { Op } = require('sequelize');
const { getAllCameras, addCamera, DEFAULT_IMAGE } = require('../service/cameraStore');
const { Customer, Equipment, Rental, RentalDetail, Payment } = require('../../models');

function getDateOrNull(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

async function getCameraById(cameraId) {
    const allCameras = await getAllCameras();
    return allCameras.find((item) => item.id === cameraId) || null;
}

async function getCustomerForSession(req) {
    const username = req.session.user && req.session.user.username;
    if (!username) return null;
    return Customer.findOne({ where: { Username: username } });
}

function deriveBookingStatusFromRental(rentalStatus) {
    if (rentalStatus === 'cancelled') return 'cancelled';
    if (rentalStatus === 'completed') return 'completed';
    if (rentalStatus === 'active') return 'confirmed';
    return 'awaiting_confirmation';
}

function derivePaymentStatus(hasPayment) {
    return hasPayment ? 'paid' : 'unpaid';
}

exports.browseCameras = async (req, res) => {
    const searchQuery = req.query.search || '';

    // Filter by brand or model
    let filteredCameras = await getAllCameras();
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredCameras = filteredCameras.filter(c =>
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

// eslint-disable-next-line complexity
exports.addCamera = async (req, res) => {
    const { brand, model, stock, pricePerDay, imageUrl } = req.body;
    const normalizedBrand = typeof brand === 'string' ? brand.trim() : '';
    const normalizedModel = typeof model === 'string' ? model.trim() : '';
    const normalizedStock = Number(stock);
    const normalizedPricePerDay = Number(pricePerDay);
    const normalizedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    const uploadedImagePath = req.file ? `/uploads/products/${req.file.filename}` : '';

    if (!normalizedBrand || !normalizedModel) {
        return res.status(400).send('Brand and model are required');
    }
    if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
        return res.status(400).send('Stock must be a non-negative integer');
    }
    if (!Number.isFinite(normalizedPricePerDay) || normalizedPricePerDay <= 0) {
        return res.status(400).send('Price per day must be greater than 0');
    }

    await addCamera({
        brand: normalizedBrand,
        model: normalizedModel,
        stock: normalizedStock,
        pricePerDay: normalizedPricePerDay,
        image: uploadedImagePath || normalizedImageUrl || DEFAULT_IMAGE
    });

    return res.redirect('/browse');
};

exports.bookCamera = async (req, res) => {
    const { cameraId, startDate, endDate } = req.body;
    const normalizedCameraId = Number(cameraId);
    const equipment = await Equipment.findByPk(normalizedCameraId);
    if (!equipment) return res.status(404).send('Camera not found');

    const start = getDateOrNull(startDate);
    const end = getDateOrNull(endDate);
    if (!start || !end || start > end) {
        return res.status(400).send('Invalid booking dates');
    }

    if (equipment.Status !== 'available') {
        return res.status(400).send('Camera is out of stock');
    }

    const overlap = await RentalDetail.findOne({
        where: {
            EquipmentID: equipment.EquipmentID,
            StartDate: { [Op.lte]: end.toISOString().slice(0, 10) },
            EndDate: { [Op.gte]: start.toISOString().slice(0, 10) }
        },
        include: [{
            model: Rental,
            required: true,
            where: { RentalStatus: { [Op.ne]: 'cancelled' } }
        }]
    });

    if (overlap) {
        return res.status(409).send('Selected camera is already booked for these dates');
    }

    const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = rentalDays * Number(equipment.DailyRate);
    const customer = await getCustomerForSession(req);
    if (!customer) return res.status(401).send('Unauthorized');

    const rental = await Rental.create({
        RentalDate: new Date(),
        TotalAmount: totalPrice,
        RentalStatus: 'pending',
        CustomerID: customer.CustomerID
    });
    await RentalDetail.create({
        RentalID: rental.RentalID,
        EquipmentID: equipment.EquipmentID,
        StartDate: start.toISOString().slice(0, 10),
        EndDate: end.toISOString().slice(0, 10),
        SubTotal: totalPrice
    });

    return res.redirect(`/booking/${rental.RentalID}/confirm`);
};

exports.showAdminDashboard = (req, res) => {
    return RentalDetail.findAll({
        include: [
            { model: Rental, required: true, include: [{ model: Customer, required: true }] },
            { model: Equipment, required: true }
        ],
        order: [['RentalDetailID', 'DESC']],
        limit: 50
    })
        .then((rows) => rows.map((row) => row.toJSON()))
        .then((rows) => res.render('admin', {
            bookings: rows.map((row) => ({
                id: row.Rental.RentalID,
                user: row.Rental.Customer.Email || row.Rental.Customer.Username,
                cameraModel: `${row.Equipment.Brand} ${row.Equipment.ModelName}`,
                startDate: row.StartDate,
                endDate: row.EndDate,
                totalPrice: Number(row.Rental.TotalAmount)
            })),
            user: req.session.user
        }))
        .catch(() => res.status(500).send('Failed to load dashboard'));
};

exports.showBookingConfirm = async (req, res) => {
    const { bookingId } = req.params;
    const rentalId = Number(bookingId);
    const rental = await Rental.findByPk(rentalId);
    if (!rental) return res.status(404).send('Booking not found');
    const customer = await Customer.findByPk(rental.CustomerID);
    if (!customer) return res.status(404).send('Booking not found');
    if (customer.Username !== req.session.user.username && req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }

    // If already confirmed/completed/cancelled, don't show a raw error page.
    if (rental.RentalStatus !== 'pending') {
        if (rental.RentalStatus === 'active') {
            return res.redirect(`/booking/${rental.RentalID}/payment`);
        }
        return res.redirect('/browse');
    }

    const detail = await RentalDetail.findOne({ where: { RentalID: rental.RentalID } });
    if (!detail) return res.status(404).send('Booking not found');
    const camera = await getCameraById(detail.EquipmentID);
    if (!camera) return res.status(404).send('Camera not found');

    res.render('booking_confirm', {
        booking: {
            id: rental.RentalID,
            cameraId: detail.EquipmentID,
            cameraModel: camera.model,
            user: customer.Username,
            startDate: detail.StartDate,
            endDate: detail.EndDate,
            totalPrice: Number(rental.TotalAmount),
            bookingStatus: deriveBookingStatusFromRental(rental.RentalStatus),
            paymentStatus: 'unpaid'
        },
        camera
    });
};

exports.confirmBooking = async (req, res) => {
    const { bookingId } = req.params;
    const rentalId = Number(bookingId);
    const rental = await Rental.findByPk(rentalId);
    if (!rental) return res.status(404).send('Booking not found');
    const customer = await Customer.findByPk(rental.CustomerID);
    if (!customer) return res.status(404).send('Booking not found');
    if (customer.Username !== req.session.user.username && req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }

    const payment = await Payment.findOne({ where: { RentalID: rental.RentalID } });
    if (rental.RentalStatus !== 'pending' || payment) {
        // If already confirmed, just go to the first page.
        return res.redirect('/browse');
    }

    rental.RentalStatus = 'active';
    await rental.save();
    // User requested: after confirm, warp back to the first page.
    return res.redirect('/browse');
};

exports.showPaymentPage = (req, res) => {
    const { bookingId } = req.params;
    const rentalId = Number(bookingId);
    return Rental.findByPk(rentalId)
        .then((rental) => {
            if (!rental) return res.status(404).send('Booking not found');
            return Customer.findByPk(rental.CustomerID).then((customer) => {
                if (!customer) return res.status(404).send('Booking not found');
                if (customer.Username !== req.session.user.username && req.session.user.role !== 'admin') {
                    return res.status(403).send('Forbidden');
                }
                return Payment.findOne({ where: { RentalID: rental.RentalID } }).then((payment) => {
                    if (payment) return res.status(409).send('Payment cannot be confirmed from its current state');
                    return res.render('payment', {
                        booking: {
                            id: rental.RentalID,
                            totalPrice: Number(rental.TotalAmount)
                        }
                    });
                });
            });
        })
        .catch(() => res.status(500).send('Failed to load payment page'));
};

exports.confirmPayment = async (req, res) => {
    const { bookingId } = req.params;
    const rentalId = Number(bookingId);
    const rental = await Rental.findByPk(rentalId);
    if (!rental) return res.status(404).send('Booking not found');
    const customer = await Customer.findByPk(rental.CustomerID);
    if (!customer) return res.status(404).send('Booking not found');
    if (customer.Username !== req.session.user.username && req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }

    const payment = await Payment.findOne({ where: { RentalID: rental.RentalID } });
    if (rental.RentalStatus !== 'active' || payment) {
        return res.status(409).send('Payment cannot be confirmed from its current state');
    }

    await Payment.create({
        RentalID: rental.RentalID,
        PaymentMethod: 'app-payment',
        Amount: rental.TotalAmount,
        PaymentDate: new Date()
    });
    rental.RentalStatus = 'completed';
    await rental.save();

    return res.render('payment_success', {
        booking: {
            id: rental.RentalID,
            bookingStatus: deriveBookingStatusFromRental(rental.RentalStatus),
            paymentStatus: derivePaymentStatus(true),
            totalPrice: Number(rental.TotalAmount)
        }
    });
};
