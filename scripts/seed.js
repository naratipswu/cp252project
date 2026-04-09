const { Category, Equipment, Customer, Rental, RentalDetail, Payment } = require('../models');
const sequelize = require('../config/db');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('--- Database Synced (Force) ---');

        // 1. Create Categories
        const catMirrorless = await Category.create({ CategoryName: 'Mirrorless' });
        const catDSLR = await Category.create({ CategoryName: 'DSLR' });
        const catLens = await Category.create({ CategoryName: 'Lens' });

        // 2. Create Equipment
        await Equipment.create({
            ModelName: 'Alpha 7 IV',
            Brand: 'Sony',
            SerialNumber: 'SN-S74-001',
            DailyRate: 1500,
            ImageURL: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
            Status: 'available',
            CategoryId: catMirrorless.id
        });

        await Equipment.create({
            ModelName: 'EOS R5',
            Brand: 'Canon',
            SerialNumber: 'SN-CR5-002',
            DailyRate: 1800,
            ImageURL: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=800',
            Status: 'available',
            CategoryId: catMirrorless.id
        });

        await Equipment.create({
            ModelName: 'D850',
            Brand: 'Nikon',
            SerialNumber: 'SN-N85-003',
            DailyRate: 1200,
            ImageURL: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
            Status: 'available',
            CategoryId: catDSLR.id
        });

        // 3. Create Admin & Test Customer
        await Customer.create({
            FirstName: 'Admin',
            LastName: 'System',
            Phone: '000-000-0000',
            Email: 'admin@gmail.com',
            Address: 'System Headquarters',
            username: 'admin',
            password: '123',
            role: 'admin'
        });

        await Customer.create({
            FirstName: 'Test',
            LastName: 'User',
            Phone: '081-234-5678',
            Email: 'test@gmail.com',
            Address: '123 Test St, Bangkok',
            username: 'test',
            password: '123',
            role: 'customer'
        });

        console.log('--- Seeding Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
