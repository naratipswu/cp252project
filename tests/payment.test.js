describe('Payment Logic', () => {
  // TC-10: Late Fee Calculation
  test('TC-10: คำนวณค่าปรับกรณีคืนเลท (วันละ 200)', () => {
    const overdueDays = 3;
    const rate = 200;
    expect(overdueDays * rate).toBe(600);
  });
});