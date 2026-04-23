const models = require('../models');
const Booking = require('../models/booking');
const Camera = require('../models/camera');
const User = require('../models/user');
const Promotion = require('../models/promotion');

describe('Models Coverage', () => {
    test('should load all main models via index', () => {
        expect(models.Customer).toBeDefined();
        expect(models.Equipment).toBeDefined();
        expect(models.Rental).toBeDefined();
        expect(models.RentalDetail).toBeDefined();
        expect(models.Payment).toBeDefined();
        expect(models.Return).toBeDefined();
        expect(models.Category).toBeDefined();
        expect(models.SyncLog).toBeDefined();
    });

    test('should load aliased models', () => {
        expect(Booking).toBeDefined();
        expect(Camera).toBeDefined();
        expect(User).toBeDefined();
    });

    test('should load Promotion model', () => {
        expect(Promotion).toBeDefined();
        expect(Promotion.name).toBe('Promotion');
    });

    test('should have defined associations', () => {
        // Customer - Rental
        expect(models.Customer.associations.Rentals).toBeDefined();
        // Rental - RentalDetail
        expect(models.Rental.associations.RentalDetails).toBeDefined();
        // RentalDetail - Equipment
        expect(models.RentalDetail.associations.Equipment).toBeDefined();
    });
});
