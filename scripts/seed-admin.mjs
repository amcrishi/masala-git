// Default admin seeder. Run with: node scripts/seed-admin.mjs
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const DEFAULT_ADMIN = {
  name: 'Super Admin',
  email: 'admin@spicecraft.in',
  password: 'Admin@123456',
  role: 'admin',
};

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ['admin', 'technician', 'user'], default: 'user' },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🌿 Connected to MongoDB');

  const existing = await User.findOne({ email: DEFAULT_ADMIN.email });
  const hashed = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

  if (existing) {
    existing.password = hashed;
    existing.role = 'admin';
    existing.name = DEFAULT_ADMIN.name;
    await existing.save();
    console.log(`✅ Updated existing admin: ${DEFAULT_ADMIN.email}`);
  } else {
    await User.create({ ...DEFAULT_ADMIN, password: hashed });
    console.log(`✅ Created default admin: ${DEFAULT_ADMIN.email}`);
  }

  console.log('\n📋 Login credentials:');
  console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
  console.log(`   Password: ${DEFAULT_ADMIN.password}`);
  console.log('\n⚠️  Change this password after first login!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
