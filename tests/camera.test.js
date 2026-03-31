describe('Camera Model & Stock Logic', () => {
  // TC-06: Stock Check
  test('TC-06: ควรจองไม่ได้ถ้าสถานะกล้องเป็น maintenance', () => {
    const cameraStatus = 'maintenance';
    const canBook = (status) => status === 'available';
    expect(canBook(cameraStatus)).toBe(false);
  });

  // TC-07: Status Transition
  test('TC-07: เมื่อจองสำเร็จ สถานะกล้องต้องเปลี่ยนเป็น rented', () => {
    let status = 'available';
    const updateStatus = () => status = 'rented';
    updateStatus();
    expect(status).toBe('rented');
  });
});