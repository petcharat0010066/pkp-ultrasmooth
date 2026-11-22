const router = require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/admin/login');
  }
  next();
}

function formProduct(body) {
  const price = Number(body.price);
  const stock = Number(body.stock);
  if (!body.name?.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    return null;
  }
  return {
    name: body.name.trim(),
    category: (body.category || 'นมและครีม').trim(),
    description: (body.description || '').trim(),
    price,
    stock
  };
}

router.get('/login', (req, res) => res.render('admin/login', { error: null }));

router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = await User.findOne({ username, role: 'admin' });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).render('admin/login', { error: 'ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง' });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).send('Session error');
    req.session.user = { id: user._id.toString(), username: user.username, fullName: user.fullName, phone: user.phone, role: user.role };
    res.redirect('/admin');
  });
});

router.get('/', requireAdmin, async (req, res) => {
  const products = await Product.find().sort({ createdAt: 1 });
  const orders = await Order.find();
  res.render('admin/index', { products, ordersCount: orders.length });
});

router.get('/products/new', requireAdmin, (req, res) => res.render('admin/form', { product: null, error: null }));

router.post('/products', requireAdmin, async (req, res) => {
  const data = formProduct(req.body);
  if (!data) return res.status(400).render('admin/form', { product: req.body, error: 'กรุณากรอกข้อมูลสินค้าให้ถูกต้อง' });
  await Product.create(data);
  res.redirect('/admin');
});

router.get('/products/:id/edit', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
  const product = await Product.findById(req.params.id);
  if (!product) return res.sendStatus(404);
  res.render('admin/form', { product, error: null });
});

router.post('/products/:id/edit', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
  const data = formProduct(req.body);
  if (!data) return res.status(400).render('admin/form', { product: { ...req.body, _id: req.params.id }, error: 'ข้อมูลสินค้าไม่ถูกต้อง' });
  await Product.findByIdAndUpdate(req.params.id, data, { runValidators: true });
  res.redirect('/admin');
});

router.post('/products/:id/delete', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

router.get('/orders', requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.render('admin/orders', { orders });
});

module.exports = router;
