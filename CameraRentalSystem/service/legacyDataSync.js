const sequelize = require('../../config/db');
const {
  Category,
  Equipment,
  Customer,
  Rental,
  RentalDetail,
  Payment,
  SyncLog
} = require('../../models');
const { cameras, users, bookings } = require('../model/data');

function usePostgres() {
  return sequelize.getDialect() === 'postgres';
}

function splitName(username) {
  const safe = String(username || 'User').trim();
  const chunks = safe.split(/\s+/).filter(Boolean);
  if (chunks.length === 0) return { firstName: 'User', lastName: 'Unknown' };
  if (chunks.length === 1) return { firstName: chunks[0], lastName: 'User' };
  return { firstName: chunks[0], lastName: chunks.slice(1).join(' ') };
}

function deriveRentalStatus(booking) {
  if (booking.paymentStatus === 'cancelled' || booking.bookingStatus === 'cancelled') return 'cancelled';
  if (booking.paymentStatus === 'paid' || booking.bookingStatus === 'completed') return 'completed';
  if (booking.bookingStatus === 'confirmed') return 'active';
  return 'pending';
}

async function ensureDefaultCategory() {
  let category = await Category.findByPk(1);
  if (!category) {
    category = await Category.create({
      CategoryID: 1,
      CategoryName: 'General'
    });
  }
  return category;
}

async function syncLegacyDataToPostgres() {
  if (!usePostgres()) return;

  const stats = {
    importedCameras: 0,
    importedCustomers: 0,
    importedRentals: 0,
    importedPayments: 0
  };

  try {
    await sequelize.authenticate();
    const defaultCategory = await ensureDefaultCategory();

    const equipmentByLegacyCameraId = new Map();
    for (const camera of cameras) {
      const serialNumber = `legacy-camera-${camera.id}`;
      let equipment = await Equipment.findOne({ where: { SerialNumber: serialNumber } });
      if (!equipment) {
        equipment = await Equipment.create({
          ModelName: camera.model,
          Brand: camera.brand,
          SerialNumber: serialNumber,
          DailyRate: camera.pricePerDay,
          ImageURL: camera.image || null,
          Status: Number(camera.stock) > 0 ? 'available' : 'maintenance',
          CategoryID: defaultCategory.CategoryID
        });
        stats.importedCameras += 1;
      }
      equipmentByLegacyCameraId.set(camera.id, equipment);
    }

    const customerByUsername = new Map();
    for (const user of users) {
      const normalizedEmail = (user.email || `${user.username}@legacy.local`).toLowerCase();
      let customer = await Customer.findOne({ where: { Email: normalizedEmail } });
      if (!customer) {
        const name = splitName(user.username);
        customer = await Customer.create({
          FirstName: name.firstName,
          LastName: name.lastName,
          Phone: '0000000000',
          Email: normalizedEmail,
          Address: 'Imported from legacy JSON'
        });
        stats.importedCustomers += 1;
      }
      customerByUsername.set(user.username, customer);
    }

    for (const booking of bookings) {
      const customer = customerByUsername.get(booking.user);
      const equipment = equipmentByLegacyCameraId.get(booking.cameraId);
      if (!customer || !equipment) continue;

      const existingDetail = await RentalDetail.findOne({
        where: {
          EquipmentID: equipment.EquipmentID,
          StartDate: booking.startDate,
          EndDate: booking.endDate
        }
      });
      if (existingDetail) continue;

      const rental = await Rental.create({
        RentalDate: booking.createdAt ? new Date(booking.createdAt) : new Date(),
        TotalAmount: booking.totalPrice || 0,
        RentalStatus: deriveRentalStatus(booking),
        CustomerID: customer.CustomerID
      });
      stats.importedRentals += 1;

      await RentalDetail.create({
        RentalID: rental.RentalID,
        EquipmentID: equipment.EquipmentID,
        StartDate: booking.startDate,
        EndDate: booking.endDate,
        SubTotal: booking.totalPrice || 0
      });

      if (booking.paymentStatus === 'paid') {
        await Payment.create({
          RentalID: rental.RentalID,
          PaymentMethod: 'legacy-import',
          Amount: booking.totalPrice || 0,
          PaymentDate: booking.paidAt ? new Date(booking.paidAt) : new Date()
        });
        stats.importedPayments += 1;
      }
    }

    await SyncLog.create({
      Source: 'legacy-json',
      Status: 'success',
      ImportedCameras: stats.importedCameras,
      ImportedCustomers: stats.importedCustomers,
      ImportedRentals: stats.importedRentals,
      ImportedPayments: stats.importedPayments,
      Message: 'Legacy JSON data synchronized to PostgreSQL.'
    });
  } catch (error) {
    try {
      await SyncLog.sync();
      await SyncLog.create({
        Source: 'legacy-json',
        Status: 'failed',
        ImportedCameras: stats.importedCameras,
        ImportedCustomers: stats.importedCustomers,
        ImportedRentals: stats.importedRentals,
        ImportedPayments: stats.importedPayments,
        Message: error.message
      });
    } catch (logError) {
      // ignore logging error, preserve original throw
    }
    throw error;
  }
}

module.exports = {
  syncLegacyDataToPostgres
};
