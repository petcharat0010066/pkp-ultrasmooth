require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

const FLAVORS = [
  { name: 'วานิลลาคลาสสิก (Classic Vanilla)', category: 'นมและครีม', price: 45, stock: 20, description: 'ไอศกรีมนมสดแท้ผสมฝักวานิลลามาดากัสการ์ หอมละมุน' },
  { name: 'ฮอกไกโดมิลค์ (Hokkaido Milk)', category: 'นมและครีม', price: 55, stock: 20, description: 'นมฮอกไกโดเข้มข้น เนื้อเนียนนุ่มละมุนลิ้น' },
  { name: 'คุกกี้แอนด์ครีม (Cookies & Cream)', category: 'นมและครีม', price: 50, stock: 22, description: 'ครีมนมสดคลุกคุกกี้ช็อกโกแลตกรุบกรอบ' },
  { name: 'กะทิสดทรงเครื่อง (Thai Coconut)', category: 'นมและครีม', price: 45, stock: 20, description: 'กะทิคั้นสดหอมมันสไตล์โฮมเมด' },
  { name: 'เผือกหอมกะทิ (Taro Coconut)', category: 'นมและครีม', price: 45, stock: 20, description: 'เผือกหอมเนื้อเนียนผสมกะทิสดหวานมัน' },
  { name: 'เรดเวลเวทครีมชีส (Red Velvet)', category: 'นมและครีม', price: 60, stock: 12, description: 'เรดเวลเวทสีหวานสลับครีมชีสเข้มข้น' },
  { name: 'ซากุระมิลค์ครีม (Sakura Milk)', category: 'นมและครีม', price: 55, stock: 18, description: 'นมสดกลิ่นซากุระหอมหวานละมุน' },
  { name: 'ดาร์กช็อกโกแลตเบลเยียม (Dark Choc)', category: 'ช็อกโกแลตและบราวนี่', price: 55, stock: 18, description: 'ดาร์กช็อกโกแลตแท้เข้มข้นถึงใจ' },
  { name: 'ช็อกโกแลตบราวนี่ฟัดจ์ (Brownie Fudge)', category: 'ช็อกโกแลตและบราวนี่', price: 60, stock: 14, description: 'ช็อกโกแลตเข้มข้นผสมชิ้นบราวนี่และซอสฟัดจ์' },
  { name: 'มิ้นท์ช็อกโกแลตชิป (Mint Choc Chip)', category: 'ช็อกโกแลตและบราวนี่', price: 55, stock: 14, description: 'มิ้นท์เย็นสดชื่นโรยช็อกโกแลตชิปกรุบกรอบ' },
  { name: 'ไวท์ช็อกสตรอว์เบอร์รี (White Choc Berry)', category: 'ช็อกโกแลตและบราวนี่', price: 60, stock: 15, description: 'ไวท์ช็อกโกแลตนุ่มละมุนราดซอสสตรอว์เบอร์รี' },
  { name: 'กล้วยหอมช็อกโกแลต (Choco Banana)', category: 'ช็อกโกแลตและบราวนี่', price: 50, stock: 15, description: 'กล้วยหอมสุกธรรมชาติผสานซอสช็อกโกแลต' },
  { name: 'ดับเบิลช็อกโกแลตชิป (Double Choc)', category: 'ช็อกโกแลตและบราวนี่', price: 60, stock: 14, description: 'ช็อกโกแลตเข้มข้นสองเท่าพร้อมช็อกโกแลตชิป' },
  { name: 'สตรอว์เบอร์รีสดครีม (Strawberry Cream)', category: 'ผลไม้และซอร์เบต์', price: 50, stock: 15, description: 'สตรอว์เบอร์รีสดปั่นละเอียดผสมครีมนมสด' },
  { name: 'มะม่วงน้ำดอกไม้ซอร์เบต์ (Mango Sorbet)', category: 'ผลไม้และซอร์เบต์', price: 50, stock: 18, description: 'ซอร์เบต์มะม่วงน้ำดอกไม้สุกหอมสดชื่น' },
  { name: 'บลูเบอร์รีชีสเค้ก (Blueberry Cheese)', category: 'ผลไม้และซอร์เบต์', price: 60, stock: 12, description: 'ครีมชีสเข้มข้นราดซอสบลูเบอร์รีและแครกเกอร์' },
  { name: 'ทุเรียนหมอนทอง (Monthong Durian)', category: 'ผลไม้และซอร์เบต์', price: 75, stock: 10, description: 'เนื้อทุเรียนหมอนทองแท้หวานมันเข้มข้น' },
  { name: 'โยเกิร์ตมิกซ์เบอร์รี (Berry Yogurt)', category: 'ผลไม้และซอร์เบต์', price: 55, stock: 16, description: 'โยเกิร์ตเปรี้ยวอมหวานผสานเบอร์รีรวม' },
  { name: 'เลมอนซอร์เบต์ (Zesty Lemon Sorbet)', category: 'ผลไม้และซอร์เบต์', price: 45, stock: 18, description: 'ซอร์เบต์เลมอนคั้นสดเปรี้ยวหวานสดชื่น' },
  { name: 'เสาวรสซอร์เบต์ (Passion Fruit)', category: 'ผลไม้และซอร์เบต์', price: 45, stock: 16, description: 'ซอร์เบต์เสาวรสแท้หอมสดชื่นเปรี้ยวหวาน' },
  { name: 'ยูซุฮันนี่ซอร์เบต์ (Yuzu Honey)', category: 'ผลไม้และซอร์เบต์', price: 55, stock: 15, description: 'ส้มยูซุผสมน้ำผึ้งหอมละมุนสดชื่น' },
  { name: 'มัทฉะชาเขียวเกียวโต (Kyoto Matcha)', category: 'ชาและกาแฟ', price: 60, stock: 16, description: 'ผงมัทฉะเกียวโตแท้หอมชาเขียวเข้มข้น' },
  { name: 'ชาไทยโบราณ (Thai Milk Tea)', category: 'ชาและกาแฟ', price: 45, stock: 25, description: 'ชาไทยชงสดใหม่หวานมันหอมกลิ่นใบชา' },
  { name: 'คาราเมลมัคคิอาโต้ (Caramel Coffee)', category: 'ชาและกาแฟ', price: 55, stock: 15, description: 'กาแฟอาราบิก้าหอมกรุ่นสลับซอสคาราเมล' },
  { name: 'ทีรามิสุอิตาเลียน (Italian Tiramisu)', category: 'ชาและกาแฟ', price: 60, stock: 14, description: 'มาสคาร์โปเนชีสผสมกาแฟและผงโกโก้' },
  { name: 'กาแฟเอสเปรสโซ่ (Espresso Roast)', category: 'ชาและกาแฟ', price: 50, stock: 16, description: 'เอสเปรสโซ่เข้มข้นหอมกรุ่นเมล็ดกาแฟคั่ว' },
  { name: 'พิสตาชิโอคั่ว (Roasted Pistachio)', category: 'ถั่วและคาราเมล', price: 65, stock: 12, description: 'ถั่วพิสตาชิโออบกรอบบดละเอียดหอมมัน' },
  { name: 'เฮเซลนัทพราลีน (Hazelnut Praline)', category: 'ถั่วและคาราเมล', price: 65, stock: 12, description: 'เฮเซลนัทคั่วคาราเมลกรุบกรอบในครีมถั่ว' },
  { name: 'ไวท์ช็อกแมคคาเดเมีย (Macadamia)', category: 'ถั่วและคาราเมล', price: 65, stock: 12, description: 'แมคคาเดเมียอบเนยชิ้นโตผสมไวท์ช็อกโกแลต' },
  { name: 'ซอลท์เท็ดคาราเมล (Salted Caramel)', category: 'ถั่วและคาราเมล', price: 55, stock: 18, description: 'คาราเมลเคี่ยวหอมหวานตัดเค็มกลมกล่อม' }
];

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('กรุณาตั้งค่า MONGODB_URI ใน .env');
  await mongoose.connect(process.env.MONGODB_URI);

  const adminUser = process.env.ADMIN_USERNAME || 'Petcharat';
  const adminPass = process.env.ADMIN_PASSWORD || '1511';
  const adminHash = await bcrypt.hash(adminPass, 12);

  await User.updateOne(
    { username: adminUser },
    { $set: { fullName: 'ผู้ดูแลระบบ Petcharat', phone: '080-000-1511', passwordHash: adminHash, role: 'admin' } },
    { upsert: true }
  );

  const custHash = await bcrypt.hash('1234', 12);
  await User.updateOne(
    { username: 'customer01' },
    { $set: { fullName: 'น้องชมพู หวานใจ (สมมติ)', phone: '089-123-4567', passwordHash: custHash, role: 'customer' } },
    { upsert: true }
  );

  if (await Product.countDocuments() === 0) {
    await Product.insertMany(FLAVORS);
  }

  console.log('Seed PKP ULTRASMOOT complete');
  await mongoose.disconnect();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
