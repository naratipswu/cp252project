const models = require('../models/index');

describe('Database Models Index', () => {
  test('All models should be exported', () => {
    expect(models.User).toBeDefined();
    expect(models.Camera).toBeDefined();
    expect(models.Booking).toBeDefined();
  });
});