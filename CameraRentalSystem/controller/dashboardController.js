const { Op } = require('sequelize');
const { Payment, Rental, RentalDetail, Customer, Equipment } = require('../../models');

function getDateRange() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    return { startOfDay, endOfDay, startOfMonth, endOfMonth };
}

async function getMonthlyIncome(startOfMonth, endOfMonth) {
    const result = await Payment.sum('Amount', {
        where: { PaymentStatus: 'approved', PaymentDate: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth } }
    });
    return result || 0;
}

async function countDailyActivity(startOfDay, endOfDay) {
    const deliveriesToday = await RentalDetail.count({
        include: [{ model: Rental, required: true, where: { RentalStatus: 'active' } }],
        where: { StartDate: { [Op.gte]: startOfDay, [Op.lt]: endOfDay } }
    });
    const returnCount = await RentalDetail.count({
        include: [{ model: Rental, required: true, where: { RentalStatus: 'completed' } }],
        where: { EndDate: { [Op.gte]: startOfDay, [Op.lt]: endOfDay } }
    });
    return { deliveriesToday, returnCount };
}

function formatBookingRow(row) {
    return {
        id: row.Rental.RentalID,
        user: row.Rental.Customer.Email || row.Rental.Customer.Username,
        cameraModel: `${row.Equipment.Brand} ${row.Equipment.ModelName}`,
        startDate: row.StartDate,
        endDate: row.EndDate,
        totalPrice: Number(row.Rental.TotalAmount)
    };
}

async function getRecentBookings() {
    const rows = await RentalDetail.findAll({
        include: [
            { model: Rental, required: true, include: [{ model: Customer, required: true }] },
            { model: Equipment, required: true }
        ],
        order: [['RentalDetailID', 'DESC']],
        limit: 50
    });
    return rows.map(r => formatBookingRow(r.toJSON()));
}

exports.showDashboard = async (req, res) => {
    try {
        const { startOfDay, endOfDay, startOfMonth, endOfMonth } = getDateRange();
        const [monthlyIncome, { deliveriesToday, returnCount }, pendingPayments, bookings] = await Promise.all([
            getMonthlyIncome(startOfMonth, endOfMonth),
            countDailyActivity(startOfDay, endOfDay),
            Payment.count({ where: { PaymentStatus: 'pending' } }),
            getRecentBookings()
        ]);

        res.render('admin', {
            user: req.session.user,
            bookings,
            stats: { monthlyIncome, deliveriesToday, returnsToday: returnCount, pendingPayments }
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Failed to load dashboard');
    }
};
