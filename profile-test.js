const { User, Booking, Camera } = require('./models'); // ปรับ Path ให้ตรง
const sequelize = require('./config/db');

async function profileOperation(name, taskFn) {
    // 1. วัด Memory ก่อนเริ่ม
    const memBefore = process.memoryUsage().heapUsed;
    // 2. วัดเวลาเริ่มต้น
    const start = performance.now();

    // รันฟังก์ชันที่ต้องการวัด
    await taskFn();

    // 3. วัดเวลาสิ้นสุด
    const end = performance.now();
    // 4. วัด Memory หลังจบ
    const memAfter = process.memoryUsage().heapUsed;

    const timeTaken = (end - start).toFixed(2);
    const memUsed = ((memAfter - memBefore) / 1024 / 1024).toFixed(2);

    console.log(`| ${name.padEnd(20)} | ${timeTaken.padStart(10)} ms | ${memUsed.padStart(10)} MB |`);
}

async function runProfiling() {
    // ใช้ sync({ force: true }) เพื่อสร้าง Table ใหม่ใน SQLite (ถ้าใช้ SQLite)
    await sequelize.sync({ force: true }); 

    console.log('| Operation            | Time (ms)  | Memory (MB) |');
    console.log('|----------------------|------------|-------------|');

    // 1. Create User (ต้องมี password)
    await profileOperation('Create User', async () => {
        await User.create({ 
            username: 'testuser', 
            email: 'test@mail.com', 
            password: 'password123' 
        });
    });

    // 2. Create Camera (สมมติว่ามีฟิลด์ name, model)
    await profileOperation('Create Camera', async () => {
        await Camera.create({ 
            model_name: 'Canon EOS R5', // เพิ่มตามที่ Error ฟ้อง
            daily_rate: 1500,           // เพิ่มตามที่ Error ฟ้อง
            status: 'available' 
        });
    });

    // 3. Create Booking (ต้องมี userId และ cameraId)
    await profileOperation('Create Booking', async () => {
        // ต้องตรวจสอบชื่อฟิลด์ใน models/booking.js ของคุณด้วยนะครับ
        // ปกติถ้าเพิ่งสร้าง User กับ Camera ตัวแรก ID จะเป็น 1
        await Booking.create({ 
            UserId: 1, 
            CameraId: 1, 
            start_date: new Date(), 
            end_date: new Date(Date.now() + 86400000), // +1 วัน
            total_price: 1500
        });
    });

    await sequelize.close();
}

runProfiling();