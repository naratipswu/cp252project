// Custom commands for Cypress tests

// Login command
Cypress.Commands.add('login', (username, password) => {
  cy.get('a').contains('Login').click();
  cy.get('input[type="text"]').type(username);
  cy.get('input[type="password"]').type(password);
  cy.get('button').contains('Login').click();
});

// Register command
Cypress.Commands.add('register', (userData) => {
  cy.get('a').contains('Register').click();
  cy.get('input[name="email"]').type(userData.email);
  cy.get('input[name="phone"]').type(userData.phone);
  cy.get('input[name="password"]').type(userData.password);
  cy.get('button').contains('Register').click();
});

// Search camera command
Cypress.Commands.add('searchCamera', (searchTerm) => {
  cy.get('input[placeholder*="search"]').type(searchTerm);
  cy.get('button').contains('Search').click();
});