jest.mock('../CameraRentalSystem/model/data', () => ({
  users: [],
  persistData: jest.fn()
}));

const authController = require('../CameraRentalSystem/controller/authController');
const { users, persistData } = require('../CameraRentalSystem/model/data');
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
    users.splice(0, users.length);
    persistData.mockClear();
    delete process.env.ENABLE_MOCK_GOOGLE_LOGIN;
  });

  test('register hashes password before persisting', async () => {
    const req = {
      body: { username: 'alice', password: 'Secret123!', email: 'alice@mail.com' },
      session: {}
    };
    const res = createResponse();

    await authController.register(req, res);

    expect(users).toHaveLength(1);
    expect(users[0].password).not.toBe('Secret123!');
    expect(users[0].password.startsWith('$2')).toBe(true);
    expect(persistData).toHaveBeenCalled();
    expect(res.redirectedTo).toBe('/browse');
  });

  test('login accepts hashed password and sets session', async () => {
    users.push({
      username: 'admin',
      password: bcrypt.hashSync('Secret123!', 10),
      email: 'admin@site.com',
      role: 'admin'
    });

    const req = {
      body: { username: 'admin', password: 'Secret123!' },
      session: {}
    };
    const res = createResponse();

    await authController.login(req, res);

    expect(req.session.user).toEqual({ username: 'admin', role: 'admin' });
    expect(res.redirectedTo).toBe('/admin');
  });

  test('mock google login is disabled by default', async () => {
    const req = { body: { email: 'user@gmail.com' }, session: {} };
    const res = createResponse();

    await authController.loginGoogle(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.sent).toBe('Google login is disabled');
  });
});
