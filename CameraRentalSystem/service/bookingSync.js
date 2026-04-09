const { SyncLog, Customer, Equipment, Rental, RentalDetail, Payment } = require('../../models');
const { users, cameras } = require('../model/data');

function usePostgres() {
  return process.env.DB_DIALECT === 'postgres';
}

function deriveRentalStatus(booking) {
  if (booking.paymentStatus === 'cancelled' || booking.bookingStatus === 'cancelled') return 'cancelled';
  if (booking.paymentStatus === 'paid' || booking.bookingStatus === 'completed') return 'completed';
  if (booking.bookingStatus === 'confirmed') return 'active';
  return 'pending';
}

function splitName(username) {
  const safe = String(username || 'User').trim();
  const chunks = safe.split(/\s+/).filter(Boolean);
  if (chunks.length === 0) return { firstName: 'User', lastName: 'Unknown' };
  if (chunks.length === 1) return { firstName: chunks[0], lastName: 'User' };
  return { firstName: chunks[0], lastName: chunks.slice(1).join(' ') };
}

async function ensureCustomerForBooking(booking) {
  const localUser = users.find((user) => user.username === booking.user);
  const email = ((localUser && localUser.email) || `${booking.user}@legacy.local`).toLowerCase();
  let customer = await Customer.findOne({ where: { Email: email } });
  if (!customer) {
    const name = splitName(booking.user);
    customer = await Customer.create({
      FirstName: name.firstName,
      LastName: name.lastName,
      Phone: '0000000000',
      Email: email,
      Address: 'Created from booking flow'
    });
  }
  return customer;
}

async function ensureEquipmentForBooking(booking) {
  let equipment = await Equipment.findByPk(booking.cameraId);
  if (equipment) return equipment;

  const localCamera = cameras.find((item) => item.id === booking.cameraId);
  if (!localCamera) return null;
  equipment = await Equipment.create({
    ModelName: localCamera.model,
    Brand: localCamera.brand,
    SerialNumber: `booking-fallback-${booking.cameraId}-${Date.now()}`,
    DailyRate: localCamera.pricePerDay,
    ImageURL: localCamera.image || null,
    Status: Number(localCamera.stock) > 0 ? 'available' : 'maintenance',
    CategoryID: 1
  });
  return equipment;
}

async function syncBookingToPostgres(booking) {
  if (!usePostgres()) return;
  try {
    const customer = await ensureCustomerForBooking(booking);
    const equipment = await ensureEquipmentForBooking(booking);
    if (!equipment) return;

    let detail = await RentalDetail.findOne({
      where: {
        EquipmentID: equipment.EquipmentID,
        StartDate: booking.startDate,
        EndDate: booking.endDate
      }
    });

    let rental;
    if (detail) {
      rental = await Rental.findByPk(detail.RentalID);
    } else {
      rental = await Rental.create({
        RentalDate: booking.createdAt ? new Date(booking.createdAt) : new Date(),
        TotalAmount: booking.totalPrice || 0,
        RentalStatus: deriveRentalStatus(booking),
        CustomerID: customer.CustomerID
      });
      detail = await RentalDetail.create({
        RentalID: rental.RentalID,
        EquipmentID: equipment.EquipmentID,
        StartDate: booking.startDate,
        EndDate: booking.endDate,
        SubTotal: booking.totalPrice || 0
      });
    }

    rental.TotalAmount = booking.totalPrice || 0;
    rental.RentalStatus = deriveRentalStatus(booking);
    await rental.save();

    if (booking.paymentStatus === 'paid') {
      const existingPayment = await Payment.findOne({ where: { RentalID: rental.RentalID } });
      if (!existingPayment) {
        await Payment.create({
          RentalID: rental.RentalID,
          PaymentMethod: 'app-payment',
          Amount: booking.totalPrice || 0,
          PaymentDate: booking.paidAt ? new Date(booking.paidAt) : new Date()
        });
      }
    }

    await SyncLog.create({
      Source: 'booking-realtime',
      Status: 'success',
      ImportedCameras: 0,
      ImportedCustomers: 0,
      ImportedRentals: 1,
      ImportedPayments: booking.paymentStatus === 'paid' ? 1 : 0,
      Message: `Synced booking ${booking.id} to PostgreSQL`
    });
  } catch (error) {
    try {
      await SyncLog.create({
        Source: 'booking-realtime',
        Status: 'failed',
        ImportedCameras: 0,
        ImportedCustomers: 0,
        ImportedRentals: 0,
        ImportedPayments: 0,
        Message: error.message
      });
    } catch (logError) {
      // ignore logging failure for this helper
    }
  }
}

module.exports = {
  syncBookingToPostgres
};
