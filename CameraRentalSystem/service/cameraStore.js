const { cameras, persistData } = require('../model/data');
const sequelize = require('../../config/db');
const Equipment = require('../../models/equipment');
const Category = require('../../models/category');

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400';

function usePostgresCameraStore() {
  return process.env.DB_DIALECT === 'postgres';
}

async function ensureCameraStoreReady() {
  if (!usePostgresCameraStore()) return;
  await sequelize.authenticate();
  await Category.sync();
  await Equipment.sync();
  const existingCount = await Equipment.count();
  let defaultCategory = await Category.findByPk(1);
  if (!defaultCategory) {
    defaultCategory = await Category.create({
      CategoryID: 1,
      CategoryName: 'General'
    });
  }
  if (existingCount === 0 && cameras.length > 0) {
    await Equipment.bulkCreate(cameras.map((item) => ({
      ModelName: item.model,
      Brand: item.brand,
      SerialNumber: `seed-${item.id}-${Date.now()}`,
      DailyRate: item.pricePerDay,
      ImageURL: item.image || DEFAULT_IMAGE,
      Status: item.stock > 0 ? 'available' : 'maintenance',
      CategoryID: defaultCategory.CategoryID
    })));
  }
}

async function getAllCameras() {
  if (!usePostgresCameraStore()) return cameras;
  const rows = await Equipment.findAll({ order: [['EquipmentID', 'ASC']] });
  return rows.map((item) => {
    const row = item.toJSON();
    return {
      id: row.EquipmentID,
      model: row.ModelName,
      brand: row.Brand,
      pricePerDay: Number(row.DailyRate),
      stock: row.Status === 'available' ? 1 : 0,
      image: row.ImageURL || DEFAULT_IMAGE
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

  if (!usePostgresCameraStore()) {
    const nextId = cameras.length > 0 ? Math.max(...cameras.map((item) => item.id)) + 1 : 1;
    const camera = { id: nextId, ...payload };
    cameras.push(camera);
    persistData();
    return camera;
  }

  let defaultCategory = await Category.findByPk(1);
  if (!defaultCategory) {
    defaultCategory = await Category.create({
      CategoryID: 1,
      CategoryName: 'General'
    });
  }
  const serialNumber = `eq-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const created = await Equipment.create({
    ModelName: payload.model,
    Brand: payload.brand,
    SerialNumber: serialNumber,
    DailyRate: payload.pricePerDay,
    ImageURL: payload.image,
    Status: payload.stock > 0 ? 'available' : 'maintenance',
    CategoryID: defaultCategory.CategoryID
  });
  const row = created.toJSON();
  return {
    id: row.EquipmentID,
    model: row.ModelName,
    brand: row.Brand,
    pricePerDay: Number(row.DailyRate),
    stock: row.Status === 'available' ? 1 : 0,
    image: row.ImageURL || DEFAULT_IMAGE
  };
}

module.exports = {
  DEFAULT_IMAGE,
  usePostgresCameraStore,
  ensureCameraStoreReady,
  getAllCameras,
  addCamera
};
