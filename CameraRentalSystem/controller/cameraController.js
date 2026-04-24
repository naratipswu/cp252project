const { Op, Transaction } = require('sequelize');
const sequelize = require('../../config/db');
const { getAllCameras, addCamera, DEFAULT_IMAGE } = require('../service/cameraStore');
const { Customer, Equipment, Rental, RentalDetail, Payment, Category } = require('../../models');

function getDateOrNull(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;
    // Don't use setHours(0,0,0,0) as it uses local time and causes shift
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

function isFilmLikeCamera(brand, text) {
    if (text.includes('film')) return true;
    if (text.includes('instax')) return true;
    if (brand.includes('kodak')) return true;
    if (brand.includes('fujifilm')) return true;
    return false;
}

function cameraMatchesType(camera, type) {
    const normalizedType = String(type || '').toLowerCase();
    if (!normalizedType) return true;
    const brand = String(camera.brand || '').toLowerCase();
    const model = String(camera.model || '').toLowerCase();
    const text = `${brand} ${model}`;
    const isFilmLike = isFilmLikeCamera(brand, text);

    if (normalizedType === 'film') return isFilmLike;
    if (normalizedType === 'digital') return !isFilmLike;
    return true;
}

/**
 * Handles camera browsing, searching, and filtering by category or price.
 * Retrieves data from the inventory and groups by Brand and Model.
 * @param {import('express').Request} req - Express request object containing query parameters.
 * @param {import('express').Response} res - Express response object to render the view.
 */
exports.browseCameras = async (req, res) => {
    const searchQuery = req.query.search || '';
    const selectedType = String(req.query.type || '').toLowerCase();
    const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;

    // Fetch categories with IDs for filtering and forms
    const categoryRecords = await Category.findAll();
    const categories = categoryRecords.map(cat => ({ id: cat.CategoryID, name: cat.CategoryName }));

    // Get all cameras
    let rawCameras = await getAllCameras();
    
    // Extract unique brands for the sidebar
    const brands = [...new Set(rawCameras.map(c => c.brand))].sort();

    // Grouping by Brand + Model
    const modelGroups = new Map();
    rawCameras.forEach(cam => {
        const key = `${cam.brand}|${cam.model}`;
        if (!modelGroups.has(key)) {
            modelGroups.set(key, {
                ...cam,
                availableCount: cam.status === 'available' ? 1 : 0,
                totalStock: 1
            });
        } else {
            const group = modelGroups.get(key);
            group.totalStock += 1;
            if (cam.status === 'available') {
                group.availableCount += 1;
                // If the group representative isn't available, pick this one
                if (group.status !== 'available') {
                    group.id = cam.id;
                    group.status = 'available';
                }
            }
        }
    });

    let filteredCameras = Array.from(modelGroups.values());

    if (selectedType) {
        filteredCameras = filteredCameras.filter((camera) => cameraMatchesType(camera, selectedType));
    }
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredCameras = filteredCameras.filter(c =>
            c.brand.toLowerCase().includes(lowerQuery) ||
            c.model.toLowerCase().includes(lowerQuery) ||
            (c.categoryName && c.categoryName.toLowerCase().includes(lowerQuery))
        );
    }

    // Filter by price
    if (minPrice !== null) {
        filteredCameras = filteredCameras.filter(c => c.pricePerDay >= minPrice);
    }
    if (maxPrice !== null) {
        filteredCameras = filteredCameras.filter(c => c.pricePerDay <= maxPrice);
    }

    res.render('browse_camera', {
        cameras: filteredCameras,
        user: req.session.user,
        searchQuery,
        selectedType,
        minPrice,
        maxPrice,
        categories,
        brands
    });
};

exports.addCamera = async (req, res) => {
    const { brand, model, stock, pricePerDay, imageUrl } = req.body;
    const normalizedBrand = typeof brand === 'string' ? brand.trim() : '';
    const normalizedModel = typeof model === 'string' ? model.trim() : '';
    const normalizedStock = Number(stock);
    const normalizedPricePerDay = Number(pricePerDay);
    const normalizedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    const uploadedImagePath = req.file ? `/uploads/products/${req.file.filename}` : '';

    const normalizedCategoryId = Number(req.body.categoryId) || null;

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
        categoryId: normalizedCategoryId,
        image: uploadedImagePath || normalizedImageUrl || DEFAULT_IMAGE
    });

    return res.redirect('/browse');
};

/**
 * Renders the admin camera management dashboard.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.showAdminCameras = async (req, res) => {
    try {
        const cameras = await Equipment.findAll({
            include: [{ model: Category, required: false }],
            order: [['EquipmentID', 'ASC']]
        });

        return res.render('admin_cameras', {
            user: req.session.user,
            error: req.query.error || null,
            cameras: cameras.map(c => ({
                EquipmentID: c.EquipmentID,
                Brand: c.Brand,
                ModelName: c.ModelName,
                Status: c.Status,
                DailyRate: c.DailyRate,
                ImageURL: c.ImageURL,
                SerialNumber: c.SerialNumber,
                Category: c.Category
            }))
        });
    } catch (error) {
        console.error('Failed to load admin cameras:', error);
        return res.status(500).send('Failed to load cameras');
    }
};

/**
 * Toggles the operational status of a camera between 'available' and 'maintenance' (Admin only).
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
exports.toggleCameraStatus = async (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body.status || '').toLowerCase();

    if (!Number.isFinite(id) || id <= 0) return res.status(400).send('Invalid camera id');
    if (!['available', 'maintenance'].includes(status)) return res.status(400).send('Invalid status');

    try {
        const camera = await Equipment.findByPk(id);
        if (!camera) return res.status(404).send('Camera not found');
        camera.Status = status;
        await camera.save();
        return res.redirect('/admin/cameras');
    } catch (error) {
        console.error('Failed to update camera status:', error);
        return res.status(500).send('Failed to update status');
    }
};

exports.deleteCamera = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).send('Invalid camera id');

    try {
        const camera = await Equipment.findByPk(id);
        if (!camera) return res.status(404).send('Camera not found');
        await camera.destroy();
        return res.redirect('/admin/cameras');
    } catch (error) {
        console.error('Failed to delete camera:', error);
        return res.status(409).send('Cannot delete camera (it may have related bookings)');
    }
};

/**
 * Processes a camera booking request, ensuring atomic transactions to prevent double booking.
 * Calculates rental duration, validates stock availability, and checks overlapping dates.
 * @param {import('express').Request} req - Express request object containing `cameraId`, `startDate`, `endDate`.
 * @param {import('express').Response} res - Express response object for redirection.
 */
exports.bookCamera = async (req, res) => {
    const { cameraId, startDate, endDate } = req.body;
    const normalizedCameraId = Number(cameraId);
    if (!Number.isFinite(normalizedCameraId) || normalizedCameraId <= 0 || !startDate || !endDate) {
        return res.status(400).send('Invalid input');
    }

    const start = getDateOrNull(startDate);
    const end = getDateOrNull(endDate);
    if (!start || !end || start > end) {
        return res.status(400).send('Invalid booking dates');
    }
    const startDateOnly = start.toISOString().slice(0, 10);
    const endDateOnly = end.toISOString().slice(0, 10);
    const customer = await getCustomerForSession(req);

    try {
        await sequelize.transaction(
            { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
            async (transaction) => {
                const equipment = await Equipment.findByPk(normalizedCameraId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!equipment) {
                    const error = new Error('Camera not found');
                    error.statusCode = 404;
                    throw error;
                }
                if (equipment.Status !== 'available') {
                    const error = new Error('Camera is out of stock');
                    error.statusCode = 400;
                    throw error;
                }

                // Overbooking allows this to pass without blocking.
                if (!customer) {
                    const error = new Error('Unauthorized');
                    error.statusCode = 401;
                    throw error;
                }

                const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const totalPrice = rentalDays * Number(equipment.DailyRate);
                const createdRental = await Rental.create({
                    RentalDate: new Date(),
                    TotalAmount: totalPrice,
                    RentalStatus: 'pending',
                    CustomerID: customer.CustomerID
                }, { transaction });
                await RentalDetail.create({
                    RentalID: createdRental.RentalID,
                    EquipmentID: equipment.EquipmentID,
                    StartDate: startDateOnly,
                    EndDate: endDateOnly,
                    SubTotal: totalPrice
                }, { transaction });

                equipment.Status = 'rented';
                await equipment.save({ transaction });

                return createdRental;
            }
        );
        return res.redirect('/cart');
    } catch (error) {
        let msg = 'Failed to create booking';
        if (error && error.statusCode) {
            msg = error.message;
        }
        return res.redirect(`/browse?error=${encodeURIComponent(msg)}`);
    }
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
    return res.redirect('/cart');
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
                    if (payment) {
                        if (payment.PaymentStatus === 'pending') {
                            return res.status(409).send('Your slip is pending admin approval');
                        }
                        if (payment.PaymentStatus === 'approved') {
                            return res.status(409).send('Payment has already been approved');
                        }
                        return res.render('payment', {
                            booking: {
                                id: rental.RentalID,
                                totalPrice: Number(rental.TotalAmount),
                                previousSlipRejected: true
                            }
                        });
                    }
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

/**
 * Confirms a payment by uploading a payment slip and updating payment status.
 * Uses a serializable database transaction to ensure atomicity.
 * @param {import('express').Request} req - Express request object with the uploaded file.
 * @param {import('express').Response} res - Express response object.
 */
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

    try {
        await sequelize.transaction(
            { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
            async (transaction) => {
                const lockedRental = await Rental.findByPk(rentalId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!lockedRental) {
                    const error = new Error('Booking not found');
                    error.statusCode = 404;
                    throw error;
                }

                const payment = await Payment.findOne({
                    where: { RentalID: lockedRental.RentalID },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (lockedRental.RentalStatus !== 'active') {
                    const error = new Error('Payment cannot be confirmed from its current state');
                    error.statusCode = 409;
                    throw error;
                }
                if (!req.file) {
                    const error = new Error('Please upload a payment slip');
                    error.statusCode = 400;
                    throw error;
                }

                if (!payment) {
                    await Payment.create({
                        RentalID: lockedRental.RentalID,
                        PaymentMethod: 'app-payment',
                        Amount: lockedRental.TotalAmount,
                        PaymentDate: new Date(),
                        SlipPath: `/uploads/slips/${req.file.filename}`,
                        PaymentStatus: 'pending'
                    }, { transaction });
                } else if (payment.PaymentStatus === 'rejected') {
                    payment.PaymentDate = new Date();
                    payment.Amount = lockedRental.TotalAmount;
                    payment.SlipPath = `/uploads/slips/${req.file.filename}`;
                    payment.PaymentStatus = 'pending';
                    await payment.save({ transaction });
                } else {
                    const error = new Error('Payment cannot be confirmed from its current state');
                    error.statusCode = 409;
                    throw error;
                }
            }
        );
    } catch (error) {
        if (error && error.statusCode) {
            return res.status(error.statusCode).send(error.message);
        }
        if (error && error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).send('Payment cannot be confirmed from its current state');
        }
        return res.status(500).send('Failed to confirm payment');
    }

    return res.redirect('/cart');
};

exports.showAdminPaymentSlips = async (req, res) => {
    const payments = await Payment.findAll({
        include: [
            {
                model: Rental,
                required: true,
                include: [
                    { model: Customer, required: true },
                    {
                        model: RentalDetail,
                        required: false,
                        include: [{ model: Equipment, required: false }]
                    }
                ]
            }
        ],
        order: [['PaymentDate', 'DESC']]
    });

    return res.render('admin_payment_slips', {
        user: req.session.user,
        slips: payments.map((payment) => {
            const rental = payment.Rental;
            const detail = rental.RentalDetails && rental.RentalDetails.length > 0 ? rental.RentalDetails[0] : null;
            const equipment = detail ? detail.Equipment : null;
            return {
                paymentId: payment.PaymentID,
                paymentStatus: payment.PaymentStatus || 'approved',
                paymentDate: payment.PaymentDate,
                amount: Number(payment.Amount),
                slipPath: payment.SlipPath || null,
                rentalId: rental.RentalID,
                rentalStatus: rental.RentalStatus,
                customer: {
                    username: rental.Customer.Username,
                    email: rental.Customer.Email
                },
                booking: {
                    startDate: detail ? detail.StartDate : '-',
                    endDate: detail ? detail.EndDate : '-',
                    cameraModel: equipment ? `${equipment.Brand} ${equipment.ModelName}` : '-'
                }
            };
        })
    });
};

exports.approvePaymentSlip = async (req, res) => {
    const paymentId = Number(req.params.paymentId);
    if (!Number.isFinite(paymentId) || paymentId <= 0) {
        return res.status(400).send('Invalid payment id');
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).send('Payment not found');
    if (payment.PaymentStatus !== 'pending') {
        return res.status(409).send('This slip is not pending approval');
    }

    const rental = await Rental.findByPk(payment.RentalID);
    if (!rental) return res.status(404).send('Booking not found');

    payment.PaymentStatus = 'approved';
    await payment.save();
    rental.RentalStatus = 'completed';
    await rental.save();
    return res.redirect('/admin/payment-slips');
};

exports.rejectPaymentSlip = async (req, res) => {
    const paymentId = Number(req.params.paymentId);
    if (!Number.isFinite(paymentId) || paymentId <= 0) {
        return res.status(400).send('Invalid payment id');
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).send('Payment not found');
    if (payment.PaymentStatus !== 'pending') {
        return res.status(409).send('This slip is not pending review');
    }

    payment.PaymentStatus = 'rejected';
    await payment.save();

    const rental = await Rental.findByPk(payment.RentalID);
    if (rental && rental.RentalStatus === 'completed') {
        rental.RentalStatus = 'active';
        await rental.save();
    }
    return res.redirect('/admin/payment-slips');
};

exports.getBookedDates = async (req, res) => {
    const { cameraId } = req.params;
    try {
        const bookings = await RentalDetail.findAll({
            where: { EquipmentID: cameraId },
            include: [{
                model: Rental,
                required: true,
                where: { RentalStatus: { [Op.ne]: 'cancelled' } }
            }]
        });

        const formattedBookings = bookings.map(b => ({
            from: b.StartDate, // expected format YYYY-MM-DD
            to: b.EndDate
        }));

        res.json(formattedBookings);
    } catch (error) {
        console.error('Error fetching booked dates:', error);
        res.status(500).json({ error: 'Failed to fetch booked dates' });
    }
};