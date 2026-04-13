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
    cy.get('input[name="email"]').type(uniqueUser + '@test.com');
    cy.get('input[name="phone"]').type('1234567890');
    cy.get('input[name="password"]').type('Test1234');
    cy.get('button').contains('REGISTER').click();

    cy.url().should('include', '/browse');
  });

  // TC003 - TC005: ต้อง visit('/browse') ทุกครั้ง
  it('TC003: User can search cameras', () => {
    cy.visit('/browse'); //
    cy.get('input[name="search"]').type('EOS R5{enter}');
    cy.get('.camera-card').should('exist');
  });


  // เว็บยังไม่มีให้ทดสอบ
  it.skip('TC004: View camera info', () => {
    cy.visit('/browse');
    cy.get('.camera-card').first().should('be.visible');
    cy.contains(/฿/i).should('be.visible'); // เช็คว่ามีราคา
  });

  it('TC005: Check date inputs work', () => {
    cy.visit('/browse');
    cy.get('input[type="date"]').first().type('2026-05-01');
    cy.get('input[type="date"]').last().type('2026-05-05');
    cy.contains('Total:').should('be.visible'); // เช็คการคำนวณราคา
  });
});