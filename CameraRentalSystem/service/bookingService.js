const { Op, Transaction } = require('sequelize');
const sequelize = require('../../config/db');
const { Customer, Equipment, Rental, RentalDetail, Payment } = require('../../models');

function makeBookingError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function findEquipmentLocked(equipmentId, transaction) {
    return Equipment.findByPk(equipmentId, {
        transaction,
        lock: transaction.LOCK.UPDATE
    });
}

async function checkDateOverlap(equipmentId, startDateOnly, endDateOnly, transaction) {
    return RentalDetail.findOne({
        where: {
            EquipmentID: equipmentId,
            StartDate: { [Op.lte]: endDateOnly },
            EndDate: { [Op.gte]: startDateOnly }
        },
        include: [{
            model: Rental,
            required: true,
            where: { RentalStatus: { [Op.notIn]: ['cancelled'] } }
        }],
        transaction,
        lock: transaction.LOCK.UPDATE
    });
}

async function createRentalRecords(customer, equipment, startDateOnly, endDateOnly, totalPrice, transaction) {
    const rental = await Rental.create({
        RentalDate: new Date(),
        TotalAmount: totalPrice,
        RentalStatus: 'pending',
        CustomerID: customer.CustomerID
    }, { transaction });

    await RentalDetail.create({
        RentalID: rental.RentalID,
        EquipmentID: equipment.EquipmentID,
        StartDate: startDateOnly,
        EndDate: endDateOnly,
        SubTotal: totalPrice
    }, { transaction });

    equipment.Status = 'rented';
    await equipment.save({ transaction });
    return rental;
}

async function createBookingTransaction(customer, equipmentId, start, end, startDateOnly, endDateOnly) {
    await sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
        async (transaction) => {
            const equipment = await findEquipmentLocked(equipmentId, transaction);
            if (!equipment) throw makeBookingError('Camera not found', 404);
            if (equipment.Status !== 'available') throw makeBookingError('Camera is out of stock', 400);
            if (!customer) throw makeBookingError('Unauthorized', 401);

            const overlap = await checkDateOverlap(equipment.EquipmentID, startDateOnly, endDateOnly, transaction);
            if (overlap) throw makeBookingError('Dates already booked', 409);

            const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const totalPrice = rentalDays * Number(equipment.DailyRate);
            await createRentalRecords(customer, equipment, startDateOnly, endDateOnly, totalPrice, transaction);
        }
    );
}

async function confirmPaymentTransaction(rentalId, slipFilename) {
    await sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
        async (transaction) => {
            const rental = await Rental.findByPk(rentalId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!rental) throw makeBookingError('Booking not found', 404);
            if (rental.RentalStatus !== 'active') throw makeBookingError('Payment cannot be confirmed from its current state', 409);
            if (!slipFilename) throw makeBookingError('Please upload a payment slip', 400);

            const payment = await Payment.findOne({
                where: { RentalID: rental.RentalID },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            const slipPath = `/uploads/slips/${slipFilename}`;
            if (!payment) {
                await Payment.create({
                    RentalID: rental.RentalID,
                    PaymentMethod: 'app-payment',
                    Amount: rental.TotalAmount,
                    PaymentDate: new Date(),
                    SlipPath: slipPath,
                    PaymentStatus: 'pending'
                }, { transaction });
            } else if (payment.PaymentStatus === 'rejected') {
                payment.PaymentDate = new Date();
                payment.Amount = rental.TotalAmount;
                payment.SlipPath = slipPath;
                payment.PaymentStatus = 'pending';
                await payment.save({ transaction });
            } else {
                throw makeBookingError('Payment cannot be confirmed from its current state', 409);
            }
        }
    );
}

module.exports = { createBookingTransaction, confirmPaymentTransaction };
