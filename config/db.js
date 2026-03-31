// const { Sequelize } = require('sequelize');

// // แก้ไขข้อมูลให้ตรงกับ DB ของคุณ
// const sequelize = new Sequelize('database_name', 'username', 'password', {
//   host: 'localhost',
//   dialect: 'postgres', // ระบุว่าเป็น postgres
//   logging: false,      // ปิด log query ในหน้า console (ถ้าอยากเห็นก็เปิดเป็น true)
// });

// module.exports = sequelize;

// for test
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // มันจะสร้างไฟล์นี้ให้เอง ไม่ต้องตั้งค่า user/pass
  logging: false,
});

module.exports = sequelize;