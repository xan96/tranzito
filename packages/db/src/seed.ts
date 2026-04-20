import { createDb, users } from './index'
import { hash } from 'bcrypt'

const DATABASE_URL = process.env.DATABASE_URL
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is required')
  process.exit(1)
}

if (!ADMIN_EMAIL) {
  console.error('ERROR: ADMIN_EMAIL is required (set in .env)')
  process.exit(1)
}

if (!ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD is required for initial seed')
  console.error('       set it in .env (можно удалить после первого seed)')
  process.exit(1)
}

if (ADMIN_PASSWORD.length < 8) {
  console.error('ERROR: ADMIN_PASSWORD must be at least 8 characters')
  process.exit(1)
}

const db = createDb(DATABASE_URL)

async function seed() {
  console.log(`Seeding admin user: ${ADMIN_EMAIL}`)

  const passwordHash = await hash(ADMIN_PASSWORD!, 10)
  const [inserted] = await db.insert(users).values({
    email: ADMIN_EMAIL!.toLowerCase(),
    passwordHash,
    fullName: 'Administrator',
    role: 'admin',
    approvalStatus: 'approved',
    approvedAt: new Date(),
  }).onConflictDoNothing().returning({ id: users.id })

  if (inserted) {
    console.log('✓ Admin created')
    console.log(`  email:    ${ADMIN_EMAIL}`)
    console.log('  password: (value of ADMIN_PASSWORD from .env)')
    console.log('')
    console.log('Можешь удалить ADMIN_PASSWORD из .env — хеш уже в БД.')
    console.log('Остальных пользователей создавай через админ-панель.')
  } else {
    console.log(`✓ Admin already exists (${ADMIN_EMAIL}) — пропускаю`)
  }

  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
