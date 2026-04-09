// Mock database
const cameras = [
    { id: 1, brand: 'Sony', model: 'A7III', stock: 5, pricePerDay: 800, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400' },
    { id: 2, brand: 'Canon', model: 'EOS R5', stock: 2, pricePerDay: 1500, image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=400' },
    { id: 3, brand: 'Fujifilm', model: 'X-T4', stock: 3, pricePerDay: 700, image: 'https://images.unsplash.com/photo-1532971295325-1e434de54dc3?auto=format&fit=crop&q=80&w=400' },
    { id: 4, brand: 'Nikon', model: 'Z6 II', stock: 4, pricePerDay: 900, image: 'https://images.unsplash.com/photo-1521575034604-e53f19e4a3aa?auto=format&fit=crop&q=80&w=400' }
];

const bookings = [];
const users = [
    {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123!',
        email: process.env.ADMIN_EMAIL || 'admin@camera.com',
        role: 'admin'
    }
];

module.exports = {
    cameras,
    bookings,
    users
};
