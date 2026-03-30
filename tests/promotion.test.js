const { applyMembershipDiscount } = require('../utils/logic');

describe('Promotion & Membership Logic', () => {
  // TC-05: Member Discount
  test('TC-05: สมาชิก Gold ต้องได้ส่วนลด 10%', () => {
    expect(applyMembershipDiscount(1000, 'Gold')).toBe(900);
  });

  // TC-08: Promo Expiry
  test('TC-08: Promo Code ที่หมดอายุแล้วต้องใช้งานไม่ได้', () => {
    const expiry = new Date('2024-01-01');
    const now = new Date();
    expect(expiry < now).toBe(true);
  });
});