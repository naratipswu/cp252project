// utils/logic.js
const calculatePrice = (dailyRate, days) => {
  if (dailyRate < 0 || days < 0) throw new Error("Price or days cannot be negative");
  return dailyRate * days;
};

const applyMembershipDiscount = (totalPrice, memberType) => {
  const discounts = { 'Gold': 0.10, 'Silver': 0.05, 'Regular': 0 };
  const discount = discounts[memberType] || 0;
  return totalPrice - (totalPrice * discount);
};

const validateBookingDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return false;
  return true;
};

module.exports = { calculatePrice, applyMembershipDiscount, validateBookingDates };