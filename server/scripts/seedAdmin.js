/**
 * Эхний admin хэрэглэгчийг үүсгэх seed script
 *
 * Ашиглах: node server/scripts/seedAdmin.js
 * Эсвэл:   node --env-file=.env server/scripts/seedAdmin.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js';

const ADMIN = {
  name:     process.env.SEED_ADMIN_NAME     || 'Admin',
  email:    process.env.SEED_ADMIN_EMAIL    || 'admin@autoparts.mn',
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
};

async function main() {
  await mongoose.connect(`${process.env.MONGODB_URL}/auto-parts-order-system`);
  console.log('MongoDB холбогдлоо.');

  const existing = await userModel.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`Admin аль хэдийн байна: ${ADMIN.email}`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
  await userModel.create({
    name: ADMIN.name,
    email: ADMIN.email,
    password: hashedPassword,
    role: 'admin',
    isAccountVerified: true,
  });

  console.log(`Admin амжилттай үүслээ!`);
  console.log(`  Имэйл:    ${ADMIN.email}`);
  console.log(`  Нууц үг:  ${ADMIN.password}`);
  console.log('Нэвтэрсний дараа нууц үгээ өөрчлөхөө мартуузай.');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
