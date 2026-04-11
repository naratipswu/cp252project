const sequelize = require('../../config/db');
const Equipment = require('../../models/equipment');
const Category = require('../../models/category');

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400';

const SEED_EQUIPMENT = [
  { brand: 'Sony', model: 'A7III', stock: 5, pricePerDay: 800, image: DEFAULT_IMAGE },
  { brand: 'Canon', model: 'EOS R5', stock: 2, pricePerDay: 1500, image: DEFAULT_IMAGE },
  { brand: 'Fujifilm', model: 'X-T4', stock: 3, pricePerDay: 700, image: DEFAULT_IMAGE },
  { brand: 'Nikon', model: 'Z6 II', stock: 4, pricePerDay: 900, image: DEFAULT_IMAGE }
];

async function ensureCameraStoreReady() {
  await sequelize.authenticate();
  await Category.sync();
  await Equipment.sync();
  const existingCount = await Equipment.count();
  const cNames = ['DSLR', 'Mirrorless', 'Lens', 'Action Camera', 'General'];
  for (const cName of cNames) {
    try {
      const existing = await Category.findOne({ where: { CategoryName: cName } });
      if (!existing) {
        // Find max ID and increment to avoid sequence issues
        const maxCat = await Category.max('CategoryID') || 0;
        await Category.create({ CategoryID: maxCat + 1, CategoryName: cName });
      }
    } catch(err) {
      console.log('Category seed error for', cName, err.message);
    }
  }

  let defaultCategory = await Category.findOne({ where: { CategoryName: 'Mirrorless' } }) || await Category.findOne();
  if (existingCount === 0 && SEED_EQUIPMENT.length > 0) {
    const now = Date.now();
    const toCreate = [];
    SEED_EQUIPMENT.forEach((item, index) => {
      const count = Number.isInteger(item.stock) && item.stock > 0 ? item.stock : 1;
      for (let i = 0; i < count; i += 1) {
        toCreate.push({
          ModelName: item.model,
          Brand: item.brand,
          SerialNumber: `seed-${index}-${now}-${i}`,
          DailyRate: item.pricePerDay,
          ImageURL: item.image || DEFAULT_IMAGE,
          Status: 'available',
          CategoryID: defaultCategory.CategoryID
        });
      }
    });
    await Equipment.bulkCreate(toCreate);
  }
}

async function getAllCameras() {
  const rows = await Equipment.findAll({ 
      include: [{ model: Category }],
      order: [['EquipmentID', 'ASC']] 
  });
  return rows.map((item) => {
    const row = item.toJSON();
    return {
      id: row.EquipmentID,
      model: row.ModelName,
      brand: row.Brand,
      pricePerDay: Number(row.DailyRate),
      stock: row.Status === 'available' ? 1 : 0,
      status: row.Status,
      image: row.ImageURL || DEFAULT_IMAGE,
      categoryId: row.CategoryID,
      categoryName: row.Category ? row.Category.CategoryName : 'General'
    };
  });
}

async function addCamera(cameraInput) {
  const payload = {
    brand: cameraInput.brand,
    model: cameraInput.model,
    stock: cameraInput.stock,
    pricePerDay: cameraInput.pricePerDay,
    image: cameraInput.image || DEFAULT_IMAGE
  };

  const catId = cameraInput.categoryId;
  let defaultCategory = await Category.findByPk(catId || 1) || await Category.findOne();
  const now = Date.now();
  const count = Number.isInteger(payload.stock) && payload.stock > 0 ? payload.stock : 1;
  const createdRows = [];
  for (let i = 0; i < count; i += 1) {
    const serialNumber = `eq-${now}-${Math.floor(Math.random() * 10000)}-${i}`;
    const created = await Equipment.create({
      ModelName: payload.model,
      Brand: payload.brand,
      SerialNumber: serialNumber,
      DailyRate: payload.pricePerDay,
      ImageURL: payload.image,
      Status: 'available',
      CategoryID: defaultCategory.CategoryID
    });
    createdRows.push(created.toJSON());
  }

  const first = createdRows[0];
  return {
    id: first.EquipmentID,
    model: first.ModelName,
    brand: first.Brand,
    pricePerDay: Number(first.DailyRate),
    stock: 1,
    image: first.ImageURL || DEFAULT_IMAGE
  };
}

module.exports = {
  DEFAULT_IMAGE,
  ensureCameraStoreReady,
  getAllCameras,
  addCamera
};
