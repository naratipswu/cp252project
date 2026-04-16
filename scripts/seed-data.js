const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('../config/db');
const { Category, Equipment, Customer, Rental, RentalDetail, Payment, Return } = require('../models');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database schema synced');

    // Check if data already exists
    const categoryCount = await Category.count();
    if (categoryCount > 0) {
      console.log('⚠️  Database already has data. Skipping seed...');
      return;
    }

    // 1. CATEGORIES
    const categories = await Category.bulkCreate([
      { CategoryName: 'DSLR' },
      { CategoryName: 'Mirrorless' },
      { CategoryName: 'Vintage' },
      { CategoryName: 'Action Camera' },
      { CategoryName: 'Accessories' }
    ]);
    console.log('✅ Created 5 categories');

    // 2. EQUIPMENT (Cameras)
    const equipmentData = [
      { ModelName: 'EOS 5D Mark IV', Brand: 'Canon', SerialNumber: 'CANON-001', DailyRate: 2500, Status: 'available', CategoryID: categories[0].CategoryID, ImageURL: '/uploads/canon-5d.jpg' },
      { ModelName: 'EOS R5', Brand: 'Canon', SerialNumber: 'CANON-002', DailyRate: 3500, Status: 'available', CategoryID: categories[1].CategoryID, ImageURL: '/uploads/canon-r5.jpg' },
      { ModelName: 'D850', Brand: 'Nikon', SerialNumber: 'NIKON-001', DailyRate: 2800, Status: 'available', CategoryID: categories[0].CategoryID, ImageURL: '/uploads/nikon-d850.jpg' },
      { ModelName: 'Z9', Brand: 'Nikon', SerialNumber: 'NIKON-002', DailyRate: 4000, Status: 'available', CategoryID: categories[1].CategoryID, ImageURL: '/uploads/nikon-z9.jpg' },
      { ModelName: 'A7R IV', Brand: 'Sony', SerialNumber: 'SONY-001', DailyRate: 3200, Status: 'available', CategoryID: categories[1].CategoryID, ImageURL: '/uploads/sony-a7r.jpg' },
      { ModelName: 'A6700', Brand: 'Sony', SerialNumber: 'SONY-002', DailyRate: 2600, Status: 'rented', CategoryID: categories[1].CategoryID, ImageURL: '/uploads/sony-a6700.jpg' },
      { ModelName: 'Leica M3', Brand: 'Leica', SerialNumber: 'LEICA-001', DailyRate: 1800, Status: 'available', CategoryID: categories[2].CategoryID, ImageURL: '/uploads/leica-m3.jpg' },
      { ModelName: 'Pentax K1000', Brand: 'Pentax', SerialNumber: 'PENTAX-001', DailyRate: 800, Status: 'available', CategoryID: categories[2].CategoryID, ImageURL: '/uploads/pentax-k1000.jpg' },
      { ModelName: 'GoPro Hero 11', Brand: 'GoPro', SerialNumber: 'GOPRO-001', DailyRate: 500, Status: 'available', CategoryID: categories[3].CategoryID, ImageURL: '/uploads/gopro-11.jpg' },
      { ModelName: 'DJI Osmo Action 4', Brand: 'DJI', SerialNumber: 'DJI-001', DailyRate: 450, Status: 'available', CategoryID: categories[3].CategoryID, ImageURL: '/uploads/dji-osmo.jpg' },
      { ModelName: 'EF 24-70mm f/2.8L', Brand: 'Canon', SerialNumber: 'LENS-001', DailyRate: 800, Status: 'available', CategoryID: categories[4].CategoryID, ImageURL: '/uploads/lens-ef-24-70.jpg' },
      { ModelName: 'AF-S 70-200mm f/2.8G ED VR', Brand: 'Nikon', SerialNumber: 'LENS-002', DailyRate: 900, Status: 'available', CategoryID: categories[4].CategoryID, ImageURL: '/uploads/lens-nikon-70-200.jpg' },
      { ModelName: 'FE 35mm f/1.4 GM', Brand: 'Sony', SerialNumber: 'LENS-003', DailyRate: 850, Status: 'available', CategoryID: categories[4].CategoryID, ImageURL: '/uploads/lens-sony-35.jpg' },
      { ModelName: 'RF 15-35mm f/2.8L IS USM', Brand: 'Canon', SerialNumber: 'LENS-004', DailyRate: 950, Status: 'maintenance', CategoryID: categories[4].CategoryID, ImageURL: '/uploads/lens-rf-15-35.jpg' },
      { ModelName: 'Z Mount 24-70mm f/2.8 S', Brand: 'Nikon', SerialNumber: 'LENS-005', DailyRate: 900, Status: 'available', CategoryID: categories[4].CategoryID, ImageURL: '/uploads/lens-z-24-70.jpg' },
      { ModelName: 'Fujifilm X-T5', Brand: 'Fujifilm', SerialNumber: 'FUJI-001', DailyRate: 2400, Status: 'available', CategoryID: categories[1].CategoryID, ImageURL: '/uploads/fuji-xt5.jpg' },
      { ModelName: 'Panasonic S1', Brand: 'Panasonic', SerialNumber: 'PANA-001', DailyRate: 2700, Status: 'available', CategoryID: categories[1].CategoryID, ImageURL: '/uploads/pana-s1.jpg' },
      { ModelName: 'Canon 6D Mark II', Brand: 'Canon', SerialNumber: 'CANON-003', DailyRate: 1800, Status: 'available', CategoryID: categories[0].CategoryID, ImageURL: '/uploads/canon-6d.jpg' },
      { ModelName: 'Hasselblad 500C', Brand: 'Hasselblad', SerialNumber: 'HASSELBLAD-001', DailyRate: 2200, Status: 'available', CategoryID: categories[2].CategoryID, ImageURL: '/uploads/hasselblad-500c.jpg' },
      { ModelName: 'Mamiya 645', Brand: 'Mamiya', SerialNumber: 'MAMIYA-001', DailyRate: 1500, Status: 'available', CategoryID: categories[2].CategoryID, ImageURL: '/uploads/mamiya-645.jpg' }
    ];
    const equipment = await Equipment.bulkCreate(equipmentData);
    console.log('✅ Created 20 cameras/equipment');

    // 3. CUSTOMERS
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminHashedPassword = await bcrypt.hash('admin123456', 10);

    const customers = await Customer.bulkCreate([
      {
        FirstName: 'Admin',
        LastName: 'System',
        Username: 'admin',
        Email: 'admin@camera.com',
        Phone: '0800000000',
        PasswordHash: adminHashedPassword,
        Role: 'admin',
        Address: 'Admin Office, Bangkok'
      },
      {
        FirstName: 'สมศักดิ์',
        LastName: 'ใจดี',
        Username: 'somchai',
        Email: 'somchai@example.com',
        Phone: '0812345678',
        PasswordHash: hashedPassword,
        Role: 'user',
        Address: '123 ถนนสีลม กรุงเทพฯ 10500'
      },
      {
        FirstName: 'ชนิดา',
        LastName: 'สวยง���ม',
        Username: 'chanida',
        Email: 'chanida@example.com',
        Phone: '0898765432',
        PasswordHash: hashedPassword,
        Role: 'user',
        Address: '456 ซอยลัดพร้าว เขตจตุจักร กรุงเทพฯ'
      },
      {
        FirstName: 'นิรันดร์',
        LastName: 'เพ็ชรสวาง',
        Username: 'nirun',
        Email: 'nirun@example.com',
        Phone: '0865432109',
        PasswordHash: hashedPassword,
        Role: 'user',
        Address: '789 ถนนพหลโยธิน ดินแดง กรุงเทพฯ'
      },
      {
        FirstName: 'วรรณา',
        LastName: 'น้อยขจร',
        Username: 'wanna',
        Email: 'wanna@example.com',
        Phone: '0876543210',
        PasswordHash: hashedPassword,
        Role: 'user',
        Address: '321 ซอยสุขุมวิท 55 บางจาก กรุงเทพฯ'
      },
      {
        FirstName: 'สรศักดิ์',
        LastName: 'กล้าหาญ',
        Username: 'sorasak',
        Email: 'sorasak@example.com',
        Phone: '0854321098',
        PasswordHash: hashedPassword,
        Role: 'user',
        Address: '654 ถนนรัชดาภิเษก วังทองหลาง กรุงเทพฯ'
      },
      {
        FirstName: 'ณัฐภัค',
        LastName: 'เจริงไทย',
        Username: 'nattapak',
        Email: 'nattapak@example.com',
        Phone: '0843210987',
        PasswordHash: hashedPassword,
        Role: 'user',
        Address: '987 ซอยอารีย์สัมมากร เขตบางเขน กรุงเทพฯ'
      },
      {
        FirstName: 'พิชญา',
        LastName: 'จันทร์สว่าง',
        Username: 'pichaya',
        Email: 'pichaya@example.com',
        Phone: '0832109876',
        PasswordHash: hashedPassword,
        Role: 'user',
        Address: '147 ถนนวิภาวดีรังสิต สะพานสูง กรุงเทพฯ'
      }
    ]);
    console.log('✅ Created 8 customers (1 admin + 7 users)');

    // 4. RENTALS
    const today = new Date();
    const startDate1 = new Date(today);
    startDate1.setDate(startDate1.getDate() - 10);
    const endDate1 = new Date(startDate1);
    endDate1.setDate(endDate1.getDate() + 5);

    const startDate2 = new Date(today);
    startDate2.setDate(startDate2.getDate() - 5);
    const endDate2 = new Date(startDate2);
    endDate2.setDate(endDate2.getDate() + 3);

    const startDate3 = new Date(today);
    startDate3.setDate(startDate3.getDate() + 2);
    const endDate3 = new Date(startDate3);
    endDate3.setDate(endDate3.getDate() + 7);

    const rentals = await Rental.bulkCreate([
      {
        RentalDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        TotalAmount: 12500,
        RentalStatus: 'completed',
        CustomerID: customers[1].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        TotalAmount: 7800,
        RentalStatus: 'active',
        CustomerID: customers[2].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        TotalAmount: 5400,
        RentalStatus: 'pending',
        CustomerID: customers[3].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        TotalAmount: 9600,
        RentalStatus: 'completed',
        CustomerID: customers[4].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        TotalAmount: 3200,
        RentalStatus: 'active',
        CustomerID: customers[5].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        TotalAmount: 15000,
        RentalStatus: 'completed',
        CustomerID: customers[6].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        TotalAmount: 4800,
        RentalStatus: 'pending',
        CustomerID: customers[7].CustomerID
      },
      {
        RentalDate: new Date(today),
        TotalAmount: 8500,
        RentalStatus: 'pending',
        CustomerID: customers[1].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        TotalAmount: 2500,
        RentalStatus: 'active',
        CustomerID: customers[2].CustomerID
      },
      {
        RentalDate: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000),
        TotalAmount: 11200,
        RentalStatus: 'completed',
        CustomerID: customers[3].CustomerID
      }
    ]);
    console.log('✅ Created 10 rentals');

    // 5. RENTAL DETAILS
    const rentalDetails = await RentalDetail.bulkCreate([
      {
        RentalID: rentals[0].RentalID,
        EquipmentID: equipment[0].EquipmentID,
        StartDate: startDate1,
        EndDate: endDate1,
        SubTotal: 12500
      },
      {
        RentalID: rentals[1].RentalID,
        EquipmentID: equipment[1].EquipmentID,
        StartDate: startDate2,
        EndDate: endDate2,
        SubTotal: 7800
      },
      {
        RentalID: rentals[2].RentalID,
        EquipmentID: equipment[2].EquipmentID,
        StartDate: startDate3,
        EndDate: endDate3,
        SubTotal: 5400
      },
      {
        RentalID: rentals[3].RentalID,
        EquipmentID: equipment[3].EquipmentID,
        StartDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        EndDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        SubTotal: 9600
      },
      {
        RentalID: rentals[4].RentalID,
        EquipmentID: equipment[4].EquipmentID,
        StartDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        EndDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
        SubTotal: 3200
      },
      {
        RentalID: rentals[5].RentalID,
        EquipmentID: equipment[5].EquipmentID,
        StartDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        EndDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        SubTotal: 15000
      },
      {
        RentalID: rentals[6].RentalID,
        EquipmentID: equipment[6].EquipmentID,
        StartDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        EndDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        SubTotal: 4800
      },
      {
        RentalID: rentals[7].RentalID,
        EquipmentID: equipment[7].EquipmentID,
        StartDate: today,
        EndDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        SubTotal: 8500
      },
      {
        RentalID: rentals[8].RentalID,
        EquipmentID: equipment[8].EquipmentID,
        StartDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        EndDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
        SubTotal: 2500
      },
      {
        RentalID: rentals[9].RentalID,
        EquipmentID: equipment[9].EquipmentID,
        StartDate: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000),
        EndDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        SubTotal: 11200
      }
    ]);
    console.log('✅ Created 10 rental details');

    // 6. PAYMENTS
    const payments = await Payment.bulkCreate([
      {
        RentalID: rentals[0].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 12500,
        PaymentDate: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'approved'
      },
      {
        RentalID: rentals[1].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 7800,
        PaymentDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'approved'
      },
      {
        RentalID: rentals[2].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 5400,
        PaymentDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'pending'
      },
      {
        RentalID: rentals[3].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 9600,
        PaymentDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'approved'
      },
      {
        RentalID: rentals[4].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 3200,
        PaymentDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'approved'
      },
      {
        RentalID: rentals[5].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 15000,
        PaymentDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'approved'
      },
      {
        RentalID: rentals[6].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 4800,
        PaymentDate: today,
        PaymentStatus: 'pending'
      },
      {
        RentalID: rentals[7].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 8500,
        PaymentDate: today,
        PaymentStatus: 'pending'
      },
      {
        RentalID: rentals[8].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 2500,
        PaymentDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'approved'
      },
      {
        RentalID: rentals[9].RentalID,
        PaymentMethod: 'bank_transfer',
        Amount: 11200,
        PaymentDate: new Date(today.getTime() - 11 * 24 * 60 * 60 * 1000),
        PaymentStatus: 'approved'
      }
    ]);
    console.log('✅ Created 10 payments');

    // 7. RETURNS (optional - only for completed rentals)
    await Return.bulkCreate([
      {
        RentalDetailID: rentalDetails[0].RentalDetailID,
        ActualReturnDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        LateFee: 0,
        DamageFee: 0,
        Notes: 'Returned in good condition'
      },
      {
        RentalDetailID: rentalDetails[3].RentalDetailID,
        ActualReturnDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        LateFee: 0,
        DamageFee: 0,
        Notes: 'Returned on time'
      },
      {
        RentalDetailID: rentalDetails[5].RentalDetailID,
        ActualReturnDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        LateFee: 0,
        DamageFee: 0,
        Notes: 'Returned in perfect condition'
      },
      {
        RentalDetailID: rentalDetails[9].RentalDetailID,
        ActualReturnDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        LateFee: 0,
        DamageFee: 0,
        Notes: 'Returned on time'
      }
    ]);
    console.log('✅ Created 4 return records');

    console.log('');
    console.log('🎉 ===== DATABASE SEEDING COMPLETED SUCCESSFULLY =====');
    console.log('');
    console.log('📊 Summary:');
    console.log('   ✓ Categories: 5');
    console.log('   ✓ Equipment: 20');
    console.log('   ✓ Customers: 8 (1 admin + 7 users)');
    console.log('   ✓ Rentals: 10');
    console.log('   ✓ Rental Details: 10');
    console.log('   ✓ Payments: 10');
    console.log('   ✓ Returns: 4');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Admin:');
    console.log('      Email: admin@camera.com');
    console.log('      Password: admin123456');
    console.log('');
    console.log('   Sample User:');
    console.log('      Email: somchai@example.com');
    console.log('      Password: password123');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();