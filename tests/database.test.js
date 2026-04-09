const models = require('../models/index');

describe('Database Models Index', () => {
  test('All models should be exported', () => {
    expect(models.Category).toBeDefined();
    expect(models.Equipment).toBeDefined();
    expect(models.Customer).toBeDefined();
    expect(models.Rental).toBeDefined();
    expect(models.RentalDetail).toBeDefined();
    expect(models.Payment).toBeDefined();
    expect(models.Return).toBeDefined();
  });
});