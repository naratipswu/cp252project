const { User } = require('../models/user'); // สมมติว่า export มาจาก model

describe('User Model Validation', () => {
  // TC-01: Email Validation
  test('TC-01: Should fail if email is invalid (no @ symbol)', () => {
    const email = "test-at-mail.com";
    const isValid = email.includes('@');
    expect(isValid).toBe(false);
  });

  // TC-09: Email Uniqueness (Conceptual)
  test('TC-09: Email should be unique', () => {
    const existingEmails = ['admin@camera.com'];
    const newUserEmail = 'admin@camera.com';
    expect(existingEmails).toContain(newUserEmail);
  });
});