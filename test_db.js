const sequelize = require('./config/db');
const Customer = require('./models/customer');

async function test() {
  const users = await Customer.findAll();
  console.log("Users in DB:", users.map(u => ({ id: u.CustomerID, username: u.Username, email: u.Email })));
  process.exit(0);
}
test();
