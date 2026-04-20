jest.mock('../models/customer', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  count: jest.fn()
}));

const authController = require('../CameraRentalSystem/controller/authController');
const Customer = require('../models/customer');
const bcrypt = require('bcryptjs');

function createResponse() {
  return {
    redirectedTo: null,
    rendered: null,
    statusCode: 200,
    sent: null,
    redirect(path) {
      this.redirectedTo = path;
      return this;
    },
    render(view, payload) {
      this.rendered = { view, payload };
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.sent = payload;
      return this;
    }
  };
}

describe('Auth Controller Security', () => {
  beforeEach(() => {
    Customer.findOne.mockReset();
    Customer.create.mockReset();
    delete process.env.ENABLE_MOCK_GOOGLE_LOGIN;
  });

  test('register hashes password before persisting', async () => {
    const req = {
      body: {
        username: 'alice@gmail.com',
        password: 'Secret123!',
        email: 'alice@gmail.com',
        firstName: 'Alice',
        lastName: 'Tester',
        phone: '0812345678',
        address: 'Bangkok'
      },
      session: {}
    };
    const res = createResponse();

    Customer.findOne.mockResolvedValue(null);
    await authController.register(req, res);

    expect(Customer.create).toHaveBeenCalledTimes(1);
    const createdPayload = Customer.create.mock.calls[0][0];
    expect(createdPayload.PasswordHash).not.toBe('Secret123!');
    expect(createdPayload.PasswordHash.startsWith('$2')).toBe(true);
    expect(res.redirectedTo).toBe('/browse');
  });

  test('login accepts hashed password and sets session', async () => {
    Customer.findOne.mockResolvedValue({
      Username: 'user@gmail.com',
      Email: 'user@gmail.com',
      PasswordHash: bcrypt.hashSync('Secret123!', 10),
      Role: 'user',
      save: jest.fn()
    });

    const req = {
      body: { username: 'user@gmail.com', password: 'Secret123!' },
      session: {}
    };
    const res = createResponse();

    await authController.login(req, res);

    expect(req.session.user).toEqual({ username: 'user@gmail.com', role: 'user' });
    expect(res.redirectedTo).toBe('/browse');
  });

  test('mock google login is disabled by default', async () => {
    const req = { body: { email: 'user@gmail.com' }, session: {} };
    const res = createResponse();

    await authController.loginGoogle(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.sent).toBe('Google login is disabled');
  });
});
