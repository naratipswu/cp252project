const { Op, fn, col } = require('sequelize');
const { Payment, Rental, RentalDetail, Customer, Equipment } = require('../../models');

exports.showDashboard = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        // 1. Monthly Income (Sum of approved payments this month)
        const incomeResult = await Payment.sum('Amount', {
            where: {
                PaymentStatus: 'approved',
                PaymentDate: {
                    [Op.gte]: startOfMonth,
                    [Op.lte]: endOfMonth
                }
            }
        });
        const monthlyIncome = incomeResult || 0;

        // 2. Deliveries Today (active rentals starting today)
        const deliveriesToday = await RentalDetail.count({
            include: [{
                model: Rental,
                required: true,
                where: { RentalStatus: 'active' }
            }],
            where: {
                StartDate: {
                    [Op.gte]: startOfDay,
                    [Op.lt]: endOfDay
                }
            }
        });

        // 3. Returns Expected Today (completed rentals ending today)
        const returnCount = await RentalDetail.count({
            include: [{
                model: Rental,
                required: true,
                where: { RentalStatus: 'completed' }
            }],
            where: {
                EndDate: {
                    [Op.gte]: startOfDay,
                    [Op.lt]: endOfDay
                }
            }
        });

        // Pending items summary (for quick access buttons)
        const pendingPayments = await Payment.count({ where: { PaymentStatus: 'pending' } });
        
        // Fetch recent bookings for the table below command center
        const recentRows = await RentalDetail.findAll({
            include: [
                { model: Rental, required: true, include: [{ model: Customer, required: true }] },
                { model: Equipment, required: true }
            ],
            order: [['RentalDetailID', 'DESC']],
            limit: 50
        });
        const bookings = recentRows.map(r => r.toJSON()).map(row => ({
            id: row.Rental.RentalID,
            user: row.Rental.Customer.Email || row.Rental.Customer.Username,
            cameraModel: `${row.Equipment.Brand} ${row.Equipment.ModelName}`,
            startDate: row.StartDate,
            endDate: row.EndDate,
            totalPrice: Number(row.Rental.TotalAmount)
        }));
        
        res.render('admin', {
            user: req.session.user,
            bookings,
            stats: {
                monthlyIncome,
                deliveriesToday,
                returnsToday: returnCount,
                pendingPayments
            }
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Failed to load dashboard');
    }
};
