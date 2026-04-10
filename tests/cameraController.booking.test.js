jest.mock('../CameraRentalSystem/service/cameraStore', () => ({
  DEFAULT_IMAGE: 'https://example.com/default.jpg',
  getAllCameras: jest.fn(),
  addCamera: jest.fn()
}));
jest.mock('../models', () => ({
  Customer: { findOne: jest.fn(), findByPk: jest.fn() },
  Equipment: { findByPk: jest.fn(), update: jest.fn() },
  Rental: { create: jest.fn(), findByPk: jest.fn() },
  RentalDetail: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
  Payment: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() }
}));

const cameraController = require('../CameraRentalSystem/controller/cameraController');
const { getAllCameras } = require('../CameraRentalSystem/service/cameraStore');
const { Customer, Equipment, Rental, RentalDetail, Payment } = require('../models');

function createResponse() {
  return {
    redirectedTo: null,
    statusCode: 200,
    sent: null,
    redirect(path) {
      this.redirectedTo = path;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.sent = payload;
      return this;
    },
    render() {
      return this;
    }
  };
}

describe('Camera Controller Booking Rules', () => {
  beforeEach(() => {
    getAllCameras.mockResolvedValue([
      { id: 1, brand: 'Sony', model: 'A7III', stock: 1, pricePerDay: 1000 }
    ]);
    Equipment.findByPk.mockReset();
    RentalDetail.findOne.mockReset();
    Customer.findOne.mockReset();
    Rental.create.mockReset();
    RentalDetail.create.mockReset();
    Rental.findByPk.mockReset();
    Customer.findByPk.mockReset();
    Payment.findOne.mockReset();
  });

  test('creates a rental when no overlap exists', async () => {
    const req = {
      body: { cameraId: 1, startDate: '2026-04-11', endDate: '2026-04-12' },
      session: { user: { username: 'alice' } }
    };
    const res = createResponse();

    Equipment.findByPk.mockResolvedValue({ EquipmentID: 1, Status: 'available', DailyRate: 1000 });
    RentalDetail.findOne.mockResolvedValue(null);
    Customer.findOne.mockResolvedValue({ CustomerID: 10 });
    Rental.create.mockResolvedValue({ RentalID: 99 });
    RentalDetail.create.mockResolvedValue({ RentalDetailID: 1 });

    await cameraController.bookCamera(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.redirectedTo).toMatch(/^\/booking\/.+\/confirm$/);
    expect(Rental.create).toHaveBeenCalledTimes(1);
    expect(RentalDetail.create).toHaveBeenCalledTimes(1);
  });

  test('blocks overlap when an overlapping rental exists', async () => {
    const req = {
      body: { cameraId: 1, startDate: '2026-04-11', endDate: '2026-04-12' },
      session: { user: { username: 'alice' } }
    };
    const res = createResponse();

    Equipment.findByPk.mockResolvedValue({ EquipmentID: 1, Status: 'available', DailyRate: 1000 });
    RentalDetail.findOne.mockResolvedValue({ RentalDetailID: 123 });

    await cameraController.bookCamera(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.sent).toBe('Selected camera is already booked for these dates');
  });

  test('rejects invalid state transition in confirmPayment', async () => {
    const req = {
      params: { bookingId: '1' },
      session: { user: { username: 'alice', role: 'user' } }
    };
    const res = createResponse();

    Rental.findByPk.mockResolvedValue({ RentalID: 1, CustomerID: 10, RentalStatus: 'pending' });
    Customer.findByPk.mockResolvedValue({ CustomerID: 10, Username: 'alice' });
    Payment.findOne.mockResolvedValue(null);

    await cameraController.confirmPayment(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.sent).toBe('Payment cannot be confirmed from its current state');
  });
});
