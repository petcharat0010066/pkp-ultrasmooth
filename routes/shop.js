const router = require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

function requireCustomer(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'customer') {
    return res.redirect('/login');
  }
  next();
}

async function cartDetails(cart) {
  const ids = Object.keys(cart).filter(id => mongoose.isValidObjectId(id));
  const products = await Product.find({ _id: { $in: ids } });
  const items = products
    .map(p => ({ product: p, quantity: Math.min(cart[p.id] || 0, p.stock) }))
    .filter(i => i.quantity > 0);
  const total = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);
  return { items, total };
}

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const category = String(req.query.category || 'ทั้งหมด').trim();
  const filter = {};
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: escaped, $options: 'i' };
  }
  if (category && category !== 'ทั้งหมด') {
    filter.category = category;
  }
  const products = await Product.find(filter).sort({ createdAt: 1 });
  res.render('shop/index', { products, q, category });
});

router.get('/products/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('ไม่พบสินค้า');
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send('ไม่พบสินค้า');
  res.render('shop/product', { product });
});

router.get('/login', (req, res) => res.render('shop/auth', { mode: 'login', error: null }));
router.get('/register', (req, res) => res.render('shop/auth', { mode: 'register', error: null }));

router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).render('shop/auth', { mode: 'login', error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).send('Session error');
    req.session.user = { id: user._id.toString(), username: user.username, fullName: user.fullName, phone: user.phone, role: user.role };
    return res.redirect(user.role === 'admin' ? '/admin' : '/');
  });
});

router.post('/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const fullName = String(req.body.fullName || '').trim();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (!username || !fullName || !phone || password.length < 4) {
    return res.status(400).render('shop/auth', { mode: 'register', error: 'กรุณากรอกข้อมูลให้ครบและรหัสผ่านอย่างน้อย 4 ตัวอักษร' });
  }
  const exists = await User.findOne({ username });
  if (exists) {
    return res.status(400).render('shop/auth', { mode: 'register', error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const created = await User.create({ username, fullName, phone, passwordHash, role: 'customer' });
  req.session.regenerate(err => {
    if (err) return res.status(500).send('Session error');
    req.session.user = { id: created._id.toString(), username: created.username, fullName: created.fullName, phone: created.phone, role: created.role };
    res.redirect('/');
  });
});

router.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

router.post('/cart/add/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
  const product = await Product.findById(req.params.id);
  if (!product || product.stock < 1) return res.status(400).send('สินค้าหมดหรือไม่พบสินค้า');
  const cart = req.session.cart || {};
  cart[product.id] = Math.min((cart[product.id] || 0) + 1, product.stock);
  req.session.cart = cart;
  res.redirect('/cart');
});

router.get('/cart', async (req, res) => {
  const detail = await cartDetails(req.session.cart || {});
  res.render('shop/cart', { ...detail, error: null });
});

router.post('/cart/remove/:id', (req, res) => {
  if (req.session.cart) delete req.session.cart[req.params.id];
  res.redirect('/cart');
});

router.post('/checkout', requireCustomer, async (req, res) => {
  const customerName = String(req.body.customerName || '').trim();
  const phone = String(req.body.phone || '').trim();
  const { items, total } = await cartDetails(req.session.cart || {});
  if (!customerName || !phone || items.length === 0) {
    return res.status(400).render('shop/cart', { items, total, error: 'กรุณากรอกชื่อ เบอร์โทร และเลือกสินค้า' });
  }
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product.id, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (!result.modifiedCount) return res.status(409).send('สต็อกเปลี่ยน กรุณากลับไปตรวจตะกร้า');
  }
  const order = await Order.create({
    userId: req.session.user.id,
    customerName,
    phone,
    total,
    items: items.map(i => ({ product: i.product.id, name: i.product.name, quantity: i.quantity, unitPrice: i.product.price }))
  });
  req.session.cart = {};
  res.render('shop/success', { order });
});

router.get('/orders', requireCustomer, async (req, res) => {
  const orders = await Order.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
  res.render('shop/orders', { orders });
});

module.exports = router;
