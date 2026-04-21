describe('Camera Rental System - UI Tests', () => {
  // TC001: Homepage
  it('TC001: Homepage loads successfully', () => {
    cy.visit('/');
    cy.contains('CAPTURE MOMENTS').should('be.visible'); // เช็คข้อความจริงในหน้า main
    cy.get('nav').should('be.visible');
  });

  // TC002: Signup (ไปหน้าตรงๆ)
  it('TC002: User can register successfully', () => {
    const uniqueUser = 'user' + Date.now();
    cy.visit('/signup');
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="username"]').type(uniqueUser);
    cy.get('input[name="email"]').type(uniqueUser + '@gmail.com');
    cy.get('input[name="phone"]').type('1234567890');
    cy.get('input[name="password"]').type('Test1234');
    cy.get('button').contains('REGISTER').click();

    cy.url().should('include', '/browse');
    cy.contains('Logout').should('be.visible'); // ยืนยันว่า Login สำเร็จหลังสมัคร
  });

  // TC003 - TC005: ต้อง visit('/browse') ทุกครั้ง
  it('TC003: User can search cameras', () => {
    cy.visit('/browse'); //
    cy.get('input[name="search"]').type('EOS R5{enter}');
    cy.get('.camera-card').should('be.visible').and('contain', 'EOS R5'); // เช็คว่าผลลัพธ์ตรงกับที่ค้นหา
  });


  // TC004: View camera info
  it('TC004: View camera info', () => {
    cy.visit('/browse');
    cy.get('.camera-card').first().should('be.visible');
    cy.contains(/฿/i).should('be.visible'); // เช็คว่ามีราคา
  });

  it('TC005: Check date inputs work', () => {
    // 1. Mock Login first (เลือกบัญชีที่มีอยู่แล้วเพื่อความง่าย)
    cy.visit('/auth/google/mock');
    cy.contains('User 1').click(); // คลิกเลือกบัญชี User 1

    // 2. Visit browse และระบุวันที่
    cy.visit('/browse');
    // ใช้ force: true เพราะบางครั้ง flatpickr อาจจะกวนการพิมพ์ปกติ
    cy.get('input.date-picker-start').first().type('2026-08-01', { force: true });
    cy.get('input.date-picker-end').first().type('2026-08-05', { force: true });

    // 3. กดจองและเช็คว่ามาที่หน้าตะกร้า (Cart) และเห็นยอดเงิน
    cy.get('button').contains('Reserve Now').first().click();
    cy.url().should('include', '/cart');
    cy.contains('THB').should('be.visible');
    cy.contains('pending').should('be.visible'); // เช็คสถานะการจองว่าเริ่มต้นเป็น pending
  });
});