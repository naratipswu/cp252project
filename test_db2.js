const sequelize = require('./config/db');
const { Op } = require('sequelize');
const Customer = require('./models/customer');

async function test() {
  const normalizedUsername = 'grace@gmail.com';
  const matchedUser = await Customer.findOne({
      where: {
          [Op.or]: [
              { Username: normalizedUsername },
              { Email: normalizedUsername }
          ]
      }
  });

  if (matchedUser) {
     console.log("FOUND!");
     console.log(matchedUser.toJSON());
  } else {
     console.log("NOT FOUND!");
  }
  process.exit(0);
}
test();
