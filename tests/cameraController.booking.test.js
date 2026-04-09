jest.mock('../CameraRentalSystem/model/data', () => ({
  cameras: [],
  bookings: [],
  persistData: jest.fn()
}));

const cameraController = require('../CameraRentalSystem/controller/cameraController');
const { cameras, bookings, persistData } = require('../CameraRentalSystem/model/data');

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
    cameras.splice(0, cameras.length, {
      id: 1,
      brand: 'Sony',
      model: 'A7III',
      stock: 2,
      pricePerDay: 1000
    });
    bookings.splice(0, bookings.length);
    persistData.mockClear();
  });

  test('allows overlap when stock still available', () => {
    bookings.push({
      id: 'existing-1',
      cameraId: 1,
      user: 'bob',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      bookingStatus: 'confirmed',
      paymentStatus: 'unpaid'
    });

    const req = {
      body: { cameraId: 1, startDate: '2026-04-11', endDate: '2026-04-12' },
      session: { user: { username: 'alice' } }
    };
    const res = createResponse();

    cameraController.bookCamera(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.redirectedTo).toMatch(/^\/booking\/.+\/confirm$/);
    expect(bookings).toHaveLength(2);
    expect(persistData).toHaveBeenCalled();
  });

  test('blocks overlap when overlapping bookings reach stock', () => {
    bookings.push(
      {
        id: 'existing-1',
        cameraId: 1,
        user: 'bob',
        startDate: '2026-04-10',
        endDate: '2026-04-12',
        bookingStatus: 'confirmed',
        paymentStatus: 'unpaid'
      },
      {
        id: 'existing-2',
        cameraId: 1,
        user: 'eve',
        startDate: '2026-04-11',
        endDate: '2026-04-12',
        bookingStatus: 'awaiting_confirmation',
        paymentStatus: 'unpaid'
      }
    );

    const req = {
      body: { cameraId: 1, startDate: '2026-04-11', endDate: '2026-04-12' },
      session: { user: { username: 'alice' } }
    };
    const res = createResponse();

    cameraController.bookCamera(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.sent).toBe('Selected camera is already booked for these dates');
    expect(bookings).toHaveLength(2);
  });

  test('rejects invalid state transition in confirmPayment', () => {
    bookings.push({
      id: 'booking-1',
      cameraId: 1,
      user: 'alice',
      startDate: '2026-04-10',
      endDate: '2026-04-12',
      bookingStatus: 'awaiting_confirmation',
      paymentStatus: 'unpaid'
    });
    const req = {
      params: { bookingId: 'booking-1' },
      session: { user: { username: 'alice', role: 'user' } }
    };
    const res = createResponse();

    cameraController.confirmPayment(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.sent).toBe('Payment cannot be confirmed from its current state');
  });
});
