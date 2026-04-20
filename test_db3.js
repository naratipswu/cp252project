const sequelize = require('./config/db');
const Customer = require('./models/customer');
const bcrypt = require('bcryptjs');

async function resetPass() {
    const user = await Customer.findOne({ where: { Email: 'grace@gmail.com' } });
    if(user) {
        user.PasswordHash = await bcrypt.hash('password123', 10);
        await user.save();
        console.log("Password reset successfully for grace@gmail.com to 'password123'");
    }
    process.exit(0);
}
resetPass();
