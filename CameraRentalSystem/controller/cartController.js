const { Op } = require('sequelize');
const { Customer, Rental, RentalDetail, Equipment, Payment } = require('../../models');

async function getCustomerForSession(req) {
  const username = req.session.user && req.session.user.username;
  if (!username) return null;
  return Customer.findOne({ where: { Username: username } });
}

function toCartItem(detail, paidRentalIds) {
  const rental = detail.Rental;
  const equipment = detail.Equipment;
  const isPaid = paidRentalIds.has(detail.RentalID);
  return {
    rentalId: detail.RentalID,
    rentalStatus: rental.RentalStatus,
    paymentStatus: isPaid ? 'paid' : 'unpaid',
    startDate: detail.StartDate,
    endDate: detail.EndDate,
    totalAmount: Number(rental.TotalAmount),
    camera: {
      id: equipment.EquipmentID,
      brand: equipment.Brand,
      model: equipment.ModelName,
      image: equipment.ImageURL || null
    }
  };
}

exports.showCart = async (req, res) => {
  const customer = await getCustomerForSession(req);
  if (!customer) return res.status(401).send('Unauthorized');

  const details = await RentalDetail.findAll({
    include: [
      { model: Rental, required: true, where: { CustomerID: customer.CustomerID } },
      { model: Equipment, required: true }
    ],
    order: [['RentalDetailID', 'DESC']]
  });

  const rentalIds = details.map((d) => d.RentalID);
  const payments = rentalIds.length > 0
    ? await Payment.findAll({ where: { RentalID: { [Op.in]: rentalIds } } })
    : [];
  const paidRentalIds = new Set(payments.map((p) => p.RentalID));

  const items = details.map((d) => toCartItem(d, paidRentalIds));
  const openItems = items.filter((i) => i.rentalStatus === 'pending' || i.rentalStatus === 'active');

  return res.render('cart', {
    user: req.session.user,
    items: openItems
  });
};

exports.cancelCartItem = async (req, res) => {
  const rentalId = Number(req.params.rentalId);
  if (!Number.isFinite(rentalId) || rentalId <= 0) return res.status(400).send('Invalid rental id');

  const customer = await getCustomerForSession(req);
  if (!customer) return res.status(401).send('Unauthorized');

  const rental = await Rental.findByPk(rentalId);
  if (!rental) return res.status(404).send('Booking not found');
  if (Number(rental.CustomerID) !== Number(customer.CustomerID) && req.session.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }

  const payment = await Payment.findOne({ where: { RentalID: rental.RentalID } });
  if (payment) return res.status(409).send('Cannot cancel a paid booking');

  rental.RentalStatus = 'cancelled';
  await rental.save();
  return res.redirect('/cart');
};

