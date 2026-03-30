const User = require('./user');
const Camera = require('./camera');
const Booking = require('./booking');
const Payment = require('./payment');

// 1 คน จองได้หลายครั้ง
User.hasMany(Booking);
Booking.belongsTo(User);

// 1 กล้อง ถูกจองได้หลายครั้ง
Camera.hasMany(Booking);
Booking.belongsTo(Camera);

// 1 การจอง มีได้ 1 ยอดชำระเงิน
Booking.hasOne(Payment);
Payment.belongsTo(Booking);

module.exports = { User, Camera, Booking, Payment };