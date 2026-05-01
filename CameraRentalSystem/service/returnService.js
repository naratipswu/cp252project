const { Transaction } = require('sequelize');
const sequelize = require('../../config/db');
const { Equipment, Rental, RentalDetail, Return, SyncLog } = require('../../models');

function makeReturnError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function findDetailWithRental(detailId, transaction) {
    return RentalDetail.findByPk(detailId, {
        include: [{ model: Rental, required: true }],
        transaction,
        lock: transaction.LOCK.UPDATE
    });
}

async function checkReturnEligibility(detail, detailId, transaction) {
    if (!detail) throw makeReturnError('Rental detail not found', 404);
    if (detail.Rental.RentalStatus !== 'completed') {
        throw makeReturnError('Rental is not in a state to be returned', 400);
    }
    const existing = await Return.findOne({
        where: { RentalDetailID: detailId },
        transaction,
        lock: transaction.LOCK.UPDATE
    });
    if (existing) throw makeReturnError('This item has already been returned', 409);
}

async function recordReturnAndRestoreEquipment(detailId, equipmentId, lFee, dFee, notes, transaction) {
    await Return.create({
        RentalDetailID: detailId,
        ActualReturnDate: new Date(),
        LateFee: lFee,
        DamageFee: dFee,
        Notes: notes || null
    }, { transaction });

    const equipment = await Equipment.findByPk(equipmentId, { transaction });
    if (equipment) {
        equipment.Status = 'available';
        await equipment.save({ transaction });
    }
}

async function processReturnTransaction(detailId, lFee, dFee, notes) {
    await sequelize.transaction(
        { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
        async (transaction) => {
            const detail = await findDetailWithRental(detailId, transaction);
            await checkReturnEligibility(detail, detailId, transaction);
            await recordReturnAndRestoreEquipment(detailId, detail.EquipmentID, lFee, dFee, notes, transaction);
        }
    );
}

async function logReturnError(error) {
    try {
        await SyncLog.create({
            Source: 'processReturn',
            Status: 'failed',
            Message: error ? (error.message || String(error)) : 'Unknown error'
        });
    } catch (logErr) {
        console.error('Failed to log sync error:', logErr);
    }
}

module.exports = { processReturnTransaction, logReturnError };
