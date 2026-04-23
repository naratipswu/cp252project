jest.mock('../models', () => {
  const mockCategory = {
    findOne: jest.fn(),
    hasMany: jest.fn()
  };
  const mockEquipment = {
    findByPk: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn()
  };
  const mockCustomer = {
    findOne: jest.fn(),
    hasMany: jest.fn()
  };
  const mockRental = {
    findByPk: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn()
  };
  const mockRentalDetail = {
    findAll: jest.fn(),
    belongsTo: jest.fn()
  };
  const mockPayment = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    belongsTo: jest.fn()
  };
  const mockReturn = {
    findOne: jest.fn(),
    belongsTo: jest.fn()
  };

  return {
    Category: mockCategory,
    Equipment: mockEquipment,
    Customer: mockCustomer,
    Rental: mockRental,
    RentalDetail: mockRentalDetail,
    Payment: mockPayment,
    Return: mockReturn
  };
});

jest.mock('../models/customer', () => ({
  findOne: jest.fn()
}));

jest.mock('../models/rental', () => ({
  findByPk: jest.fn()
}));

jest.mock('../models/rentalDetail', () => ({
  findAll: jest.fn()
}));

jest.mock('../models/payment', () => ({
  findAll: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../models/equipment', () => ({
  findByPk: jest.fn()
}));

const cartController = require('../CameraRentalSystem/controller/cartController');
const { Customer, Rental, RentalDetail, Payment, Equipment } = require('../models');

function createResponse() {
  return {
    statusCode: 200,
    renderedView: null,
    redirectedTo: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(msg) {
      this.message = msg;
      return this;
    },
    render(view, data) {
      this.renderedView = { view, data };
      return this;
    },
    redirect(path) {
      this.redirectedTo = path;
      return this;
    }
  };
}

describe('CartController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showCart', () => {
    test('should return 401 when user not authenticated', async () => {
      const req = { session: {} };
      const res = createResponse();

      Customer.findOne.mockResolvedValue(null);

      await cartController.showCart(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.message).toBe('Unauthorized');
    });

    test('should render cart with open items', async () => {
      const req = {
        session: { user: { username: 'testuser' } }
      };
      const res = createResponse();

      const mockCustomer = { CustomerID: 1 };
      const mockEquipment = { EquipmentID: 10, Brand: 'Sony', ModelName: 'A7III', ImageURL: null };
      const mockRental = { RentalID: 100, RentalStatus: 'pending', TotalAmount: 5000, CustomerID: 1 };
      const mockDetail = { 
        RentalID: 100, 
        RentalDetailID: 1, 
        StartDate: new Date(), 
        EndDate: new Date(), 
        Rental: mockRental, 
        Equipment: mockEquipment 
      };
      const mockPayment = { RentalID: 100, PaymentStatus: 'approved', SlipPath: null };

      Customer.findOne.mockResolvedValue(mockCustomer);
      RentalDetail.findAll.mockResolvedValue([mockDetail]);
      Payment.findAll.mockResolvedValue([mockPayment]);

      await cartController.showCart(req, res);

      expect(res.renderedView.view).toBe('cart');
      expect(res.renderedView.data.items.length).toBeGreaterThan(0);
      expect(res.renderedView.data.user).toEqual({ username: 'testuser' });
    });

    test('should separate pending items from history items', async () => {
      const req = {
        session: { user: { username: 'testuser' } }
      };
      const res = createResponse();

      const mockCustomer = { CustomerID: 1 };
      const mockEquipment = { EquipmentID: 10, Brand: 'Sony', ModelName: 'A7III', ImageURL: null };
      
      const mockDetail1 = { 
        RentalID: 100, 
        RentalDetailID: 1, 
        StartDate: new Date(), 
        EndDate: new Date(), 
        Rental: { RentalID: 100, RentalStatus: 'pending', TotalAmount: 5000, CustomerID: 1 }, 
        Equipment: mockEquipment 
      };
      
      const mockDetail2 = { 
        RentalID: 101, 
        RentalDetailID: 2, 
        StartDate: new Date(), 
        EndDate: new Date(), 
        Rental: { RentalID: 101, RentalStatus: 'completed', TotalAmount: 3000, CustomerID: 1 }, 
        Equipment: mockEquipment 
      };

      Customer.findOne.mockResolvedValue(mockCustomer);
      RentalDetail.findAll.mockResolvedValue([mockDetail1, mockDetail2]);
      Payment.findAll.mockResolvedValue([]);

      await cartController.showCart(req, res);

      expect(res.renderedView.data.items.length).toBe(1);
      expect(res.renderedView.data.historyItems.length).toBe(1);
    });
  });

  describe('cancelCartItem', () => {
    test('should return 400 for invalid rental id', async () => {
      const req = { params: { rentalId: 'invalid' }, session: { user: { username: 'testuser' } } };
      const res = createResponse();

      await cartController.cancelCartItem(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.message).toBe('Invalid rental id');
    });

    test('should return 401 when not authenticated', async () => {
      const req = { params: { rentalId: 100 }, session: {} };
      const res = createResponse();

      Customer.findOne.mockResolvedValue(null);

      await cartController.cancelCartItem(req, res);

      expect(res.statusCode).toBe(401);
    });

    test('should return 404 when rental not found', async () => {
      const req = { 
        params: { rentalId: 100 }, 
        session: { user: { username: 'testuser' } } 
      };
      const res = createResponse();

      Customer.findOne.mockResolvedValue({ CustomerID: 1 });
      Rental.findByPk.mockResolvedValue(null);

      await cartController.cancelCartItem(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.message).toBe('Booking not found');
    });

    test('should return 403 when user is not rental owner', async () => {
      const req = { 
        params: { rentalId: 100 }, 
        session: { user: { username: 'testuser', role: 'user' } } 
      };
      const res = createResponse();

      Customer.findOne.mockResolvedValue({ CustomerID: 1 });
      Rental.findByPk.mockResolvedValue({ 
        RentalID: 100, 
        CustomerID: 99, 
        RentalStatus: 'pending',
        save: jest.fn()
      });

      await cartController.cancelCartItem(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.message).toBe('Forbidden');
    });

    test('should cancel rental successfully', async () => {
      const req = { 
        params: { rentalId: 100 }, 
        session: { user: { username: 'testuser', role: 'user' } } 
      };
      const res = createResponse();

      const mockCustomer = { CustomerID: 1 };
      const mockRental = { 
        RentalID: 100, 
        CustomerID: 1, 
        RentalStatus: 'pending',
        save: jest.fn()
      };
      const mockEquipment = { EquipmentID: 10, Status: 'rented', save: jest.fn() };
      const mockDetail = { RentalID: 100, EquipmentID: 10 };

      Customer.findOne.mockResolvedValue(mockCustomer);
      Rental.findByPk.mockResolvedValue(mockRental);
      Payment.findOne.mockResolvedValue(null);
      RentalDetail.findAll.mockResolvedValue([mockDetail]);
      Equipment.findByPk.mockResolvedValue(mockEquipment);

      await cartController.cancelCartItem(req, res);

      expect(mockRental.RentalStatus).toBe('cancelled');
      expect(mockRental.save).toHaveBeenCalled();
      expect(res.redirectedTo).toBe('/cart');
    });

    test('should prevent cancellation if payment exists', async () => {
      const req = { 
        params: { rentalId: 100 }, 
        session: { user: { username: 'testuser', role: 'user' } } 
      };
      const res = createResponse();

      Customer.findOne.mockResolvedValue({ CustomerID: 1 });
      Rental.findByPk.mockResolvedValue({ 
        RentalID: 100, 
        CustomerID: 1, 
        RentalStatus: 'pending'
      });
      Payment.findOne.mockResolvedValue({ PaymentStatus: 'pending' });

      await cartController.cancelCartItem(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.message).toBe('Cannot cancel booking after payment submission');
    });
  });
});