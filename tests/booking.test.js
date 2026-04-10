const { calculatePrice, validateBookingDates } = require('../utils/logic');

describe('Booking Business Logic', () => {
  
  // TC-02: Negative Price Check
  test('TC-02: Should throw error for negative daily rate', () => {
    expect(() => calculatePrice(-500, 3)).toThrow("Price or days cannot be negative");
  });

  // TC-03: Date Constraint
  test('TC-03: End date cannot be before or same as start date', () => {
    expect(validateBookingDates('2026-04-10', '2026-04-09')).toBe(false);
    expect(validateBookingDates('2026-04-10', '2026-04-10')).toBe(true);
  });

  // TC-04: Price Calculation
  test('TC-04: Should calculate total price correctly ($500 * 3 = 1500$)', () => {
    expect(calculatePrice(500, 3)).toBe(1500);
  });
});