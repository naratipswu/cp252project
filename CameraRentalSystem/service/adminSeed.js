const bcrypt = require('bcryptjs');
const Customer = require('../../models/customer');

const PASSWORD_HASH_ROUNDS = Number(process.env.PASSWORD_HASH_ROUNDS || 10);

function getSeedAdminEnv() {
  const username = String(process.env.ADMIN_USERNAME || '').trim();
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');

  if (!username || !email || !password) {
    throw new Error('No admin account exists. Set ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD to seed the first admin.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  }
  return { username, email, password };
}

async function findExistingSeedCustomer({ username, email }) {
  const byUsername = await Customer.findOne({ where: { Username: username } });
  if (byUsername) return byUsername;
  return Customer.findOne({ where: { Email: email } });
}

async function ensureAdminSeed() {
  // If an admin already exists, do nothing.
  const adminCount = await Customer.count({ where: { Role: 'admin' } });
  if (adminCount > 0) return;

  const { username, email, password } = getSeedAdminEnv();

  // If a matching user already exists (e.g. from legacy data), promote it to admin instead of failing.
  const existing = await findExistingSeedCustomer({ username, email });

  if (existing) {
    existing.Role = 'admin';
    if (!existing.PasswordHash) {
      existing.PasswordHash = bcrypt.hashSync(password, PASSWORD_HASH_ROUNDS);
    }
    if (!existing.Username) existing.Username = username;
    if (!existing.Email) existing.Email = email;
    await existing.save();
    return;
  }

  await Customer.create({
    FirstName: 'Admin',
    LastName: 'User',
    Username: username,
    Phone: '0000000000',
    Email: email,
    Address: null,
    PasswordHash: bcrypt.hashSync(password, PASSWORD_HASH_ROUNDS),
    Role: 'admin',
    AvatarPath: null
  });
}

module.exports = { ensureAdminSeed };
