const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE_PATH = path.join(__dirname, 'data-store.json');
const PASSWORD_HASH_ROUNDS = Number(process.env.PASSWORD_HASH_ROUNDS || 10);

function getAdminCredentials() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@camera.com';
    const plainPassword = process.env.ADMIN_PASSWORD || 'admin123!';
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
        throw new Error('ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required in production');
    }

    return {
        username,
        email,
        password: bcrypt.hashSync(plainPassword, PASSWORD_HASH_ROUNDS),
        role: 'admin'
    };
}

function getDefaultData() {
    const adminUser = getAdminCredentials();
    return {
        cameras: [
            { id: 1, brand: 'Sony', model: 'A7III', stock: 5, pricePerDay: 800, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400' },
            { id: 2, brand: 'Canon', model: 'EOS R5', stock: 2, pricePerDay: 1500, image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=400' },
            { id: 3, brand: 'Fujifilm', model: 'X-T4', stock: 3, pricePerDay: 700, image: 'https://images.unsplash.com/photo-1532971295325-1e434de54dc3?auto=format&fit=crop&q=80&w=400' },
            { id: 4, brand: 'Nikon', model: 'Z6 II', stock: 4, pricePerDay: 900, image: 'https://images.unsplash.com/photo-1521575034604-e53f19e4a3aa?auto=format&fit=crop&q=80&w=400' }
        ],
        bookings: [],
        users: [{ ...adminUser, avatar: null }]
    };
}

function persistData() {
    const dataToSave = { cameras, bookings, users };
    const tempFilePath = `${DATA_FILE_PATH}.tmp`;
    fs.writeFileSync(tempFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    fs.renameSync(tempFilePath, DATA_FILE_PATH);
}

function loadData() {
    const defaults = getDefaultData();
    if (!fs.existsSync(DATA_FILE_PATH)) {
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaults, null, 2), 'utf8');
        return defaults;
    }

    try {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            cameras: Array.isArray(parsed.cameras) ? parsed.cameras : defaults.cameras,
            bookings: Array.isArray(parsed.bookings) ? parsed.bookings : defaults.bookings,
            users: Array.isArray(parsed.users) ? parsed.users : defaults.users
        };
    } catch (error) {
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaults, null, 2), 'utf8');
        return defaults;
    }
}

const loaded = loadData();
const cameras = loaded.cameras;
const bookings = loaded.bookings;
const users = loaded.users;

// Ensure at least one admin account exists.
const hasAdmin = users.some((user) => user.role === 'admin');
if (!hasAdmin) {
    users.push(getAdminCredentials());
    persistData();
}

const usersNeedingMigration = users.filter(
    (user) => user.password && !user.password.startsWith('$2')
);
if (usersNeedingMigration.length > 0) {
    usersNeedingMigration.forEach((user) => {
        user.password = bcrypt.hashSync(user.password, PASSWORD_HASH_ROUNDS);
    });
    persistData();
}

const usersMissingAvatarField = users.filter((user) => !Object.prototype.hasOwnProperty.call(user, 'avatar'));
if (usersMissingAvatarField.length > 0) {
    usersMissingAvatarField.forEach((user) => {
        user.avatar = null;
    });
    persistData();
}

module.exports = {
    cameras,
    bookings,
    users,
    persistData,
    DATA_FILE_PATH
};
