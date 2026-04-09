const Category = require('./category');
const Equipment = require('./equipment');
const Customer = require('./customer');
const Rental = require('./rental');
const RentalDetail = require('./rentalDetail');
const Payment = require('./payment');
const Return = require('./return');
const SyncLog = require('./syncLog');

// Category 1 - N Equipment
Category.hasMany(Equipment, {
  foreignKey: 'CategoryID',
  sourceKey: 'CategoryID'
});
Equipment.belongsTo(Category, {
  foreignKey: 'CategoryID',
  targetKey: 'CategoryID'
});

// Customer 1 - N Rental
Customer.hasMany(Rental, {
  foreignKey: 'CustomerID',
  sourceKey: 'CustomerID'
});
Rental.belongsTo(Customer, {
  foreignKey: 'CustomerID',
  targetKey: 'CustomerID'
});

// Rental 1 - N RentalDetail
Rental.hasMany(RentalDetail, {
  foreignKey: 'RentalID',
  sourceKey: 'RentalID'
});
RentalDetail.belongsTo(Rental, {
  foreignKey: 'RentalID',
  targetKey: 'RentalID'
});

// Equipment 1 - N RentalDetail
Equipment.hasMany(RentalDetail, {
  foreignKey: 'EquipmentID',
  sourceKey: 'EquipmentID'
});
RentalDetail.belongsTo(Equipment, {
  foreignKey: 'EquipmentID',
  targetKey: 'EquipmentID'
});

// Rental 1 - N Payment
Rental.hasMany(Payment, {
  foreignKey: 'RentalID',
  sourceKey: 'RentalID'
});
Payment.belongsTo(Rental, {
  foreignKey: 'RentalID',
  targetKey: 'RentalID'
});

// RentalDetail 1 - 1 Return
RentalDetail.hasOne(Return, {
  foreignKey: 'RentalDetailID',
  sourceKey: 'RentalDetailID'
});
Return.belongsTo(RentalDetail, {
  foreignKey: 'RentalDetailID',
  targetKey: 'RentalDetailID'
});

module.exports = {
  Category,
  Equipment,
  Customer,
  Rental,
  RentalDetail,
  Payment,
  Return,
  SyncLog,
  // Backward-compatible aliases
  User: Customer,
  Camera: Equipment,
  Booking: Rental
};