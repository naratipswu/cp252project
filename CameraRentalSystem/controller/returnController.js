const { Op, Transaction } = require('sequelize');
const sequelize = require('../../config/db');
const { Customer, Equipment, Rental, RentalDetail, Return } = require('../../models');

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
                completedReturns.push(row);
            } else {
                pendingReturns.push(row);
            }
        }

        res.render('admin_returns', {
            user: req.session.user,
            pendingReturns,
            completedReturns
        });
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

    const { lateFee, damageFee, notes } = req.body;
    const lFee = Number(lateFee) || 0;
    const dFee = Number(damageFee) || 0;

    try {
        await sequelize.transaction(
            { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
            async (transaction) => {
                const detail = await RentalDetail.findByPk(detailId, {
                    include: [{ model: Rental, required: true }],
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!detail) {
                    const error = new Error('Rental detail not found');
                    error.statusCode = 404;
                    throw error;
                }

                if (detail.Rental.RentalStatus !== 'completed') {
                    const error = new Error('Rental is not in a state to be returned');
                    error.statusCode = 400;
                    throw error;
                }

                const existingReturn = await Return.findOne({
                    where: { RentalDetailID: detailId },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (existingReturn) {
                    const error = new Error('This item has already been returned');
                    error.statusCode = 409;
                    throw error;
                }

                // Create the Return record
                await Return.create({
                    RentalDetailID: detailId,
                    ActualReturnDate: new Date(),
                    LateFee: lFee,
                    DamageFee: dFee,
                    Notes: notes || null
                }, { transaction });

                // We keep RentalStatus as 'completed' (which means paid and fulfilled)
                // The existence of the Return record signifies it's physically returned.
            }
        );
        return res.redirect('/admin/returns');
    } catch (error) {
        if (error && error.statusCode) {
            return res.status(error.statusCode).send(error.message);
        }
        console.error('Error processing return:', error);
        return res.status(500).send('Failed to process return');
    }
};
