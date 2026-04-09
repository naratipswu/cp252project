const {
    Category,
    Equipment,
    Customer,
    Rental,
    RentalDetail,
    Payment,
    Return
} = require('./models');
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

    await profileOperation('Create Category', async () => {
        await Category.create({
            CategoryName: 'Mirrorless'
        });
    });

    await profileOperation('Create Customer', async () => {
        await Customer.create({
            FirstName: 'Test',
            LastName: 'User',
            Phone: '0800000000',
            Email: 'test@mail.com',
            Address: 'Bangkok'
        });
    });

    await profileOperation('Create Equipment', async () => {
        await Equipment.create({
            ModelName: 'Canon EOS R5',
            Brand: 'Canon',
            SerialNumber: 'SN-0001',
            DailyRate: 1500,
            Status: 'available',
            CategoryID: 1
        });
    });

    await profileOperation('Create Rental', async () => {
        await Rental.create({
            CustomerID: 1,
            RentalDate: new Date(),
            TotalAmount: 1500,
            RentalStatus: 'pending'
        });
    });

    await profileOperation('Create RentalDetail', async () => {
        await RentalDetail.create({
            RentalID: 1,
            EquipmentID: 1,
            StartDate: '2026-04-10',
            EndDate: '2026-04-11',
            SubTotal: 1500
        });
    });

    await profileOperation('Create Payment', async () => {
        await Payment.create({
            RentalID: 1,
            PaymentMethod: 'bank_transfer',
            Amount: 1500,
            PaymentDate: new Date()
        });
    });

    await profileOperation('Create Return', async () => {
        await Return.create({
            RentalDetailID: 1,
            ActualReturnDate: new Date(),
            LateFee: 0,
            DamageFee: 0,
            Notes: 'Returned in good condition'
        });
    });

    await sequelize.close();
}

runProfiling();