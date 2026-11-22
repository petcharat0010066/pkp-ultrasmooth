require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const { CATEGORIES, getFlavorStyle } = require('./utils/flavor');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  res.locals.cartCount = Object.values(req.session.cart || {}).reduce((a, b) => a + b, 0);
  res.locals.CATEGORIES = CATEGORIES;
  res.locals.getFlavorStyle = getFlavorStyle;
  next();
});

app.use('/', shopRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => res.status(404).send('404 Not Found'));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('เกิดข้อผิดพลาดภายในระบบ');
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('กรุณาตั้งค่า MONGODB_URI ใน .env');
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Open http://localhost:' + port));
}

start().catch(err => {
  console.error(err.message);
  process.exit(1);
});
