const { Customer, Equipment, Rental, RentalDetail, Return } = require('../../models');
const { processReturnTransaction, logReturnError } = require('../service/returnService');

function buildReturnRow(detail) {
    const row = {
        rentalDetailId: detail.RentalDetailID,
        rentalId: detail.Rental.RentalID,
        customer: detail.Rental.Customer.Username || detail.Rental.Customer.Email,
        camera: `${detail.Equipment.Brand} ${detail.Equipment.ModelName}`,
        startDate: detail.StartDate,
        endDate: detail.EndDate,
        totalAmount: Number(detail.Rental.TotalAmount)
    };
    if (detail.Return) {
        row.actualReturnDate = detail.Return.ActualReturnDate;
        row.lateFee = Number(detail.Return.LateFee);
        row.damageFee = Number(detail.Return.DamageFee);
        row.notes = detail.Return.Notes;
    }
    return { row, hasReturn: !!detail.Return };
}

exports.showAdminReturns = async (req, res) => {
    try {
        const rentalDetails = await RentalDetail.findAll({
            include: [
                {
                    model: Rental,
                    required: true,
                    where: { RentalStatus: 'completed' },
                    include: [{ model: Customer, required: true }]
                },
                { model: Equipment, required: true },
                { model: Return, required: false }
            ],
            order: [['RentalDetailID', 'DESC']]
        });

        const pendingReturns = [];
        const completedReturns = [];

        for (const detail of rentalDetails) {
            const { row, hasReturn } = buildReturnRow(detail);
            if (hasReturn) completedReturns.push(row);
            else pendingReturns.push(row);
        }

        res.render('admin_returns', { user: req.session.user, pendingReturns, completedReturns });
    } catch (error) {
        console.error('Error fetching returns:', error);
        res.status(500).send('Failed to load returns dashboard');
    }
};

exports.processReturn = async (req, res) => {
    const detailId = Number(req.params.rentalDetailId);
    if (!Number.isFinite(detailId) || detailId <= 0) {
        return res.status(400).send('Invalid rental detail id');
    }

    const lFee = Number(req.body.lateFee) || 0;
    const dFee = Number(req.body.damageFee) || 0;

    try {
        await processReturnTransaction(detailId, lFee, dFee, req.body.notes);
        return res.redirect('/admin/returns');
    } catch (error) {
        if (error && error.statusCode) {
            return res.status(error.statusCode).send(error.message);
        }
        await logReturnError(error);
        console.error('Error processing return:', error);
        return res.status(500).send('Failed to process return');
    }
};
