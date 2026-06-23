import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@aisel.test' },
    update: {},
    create: {
      email: 'admin@aisel.test',
      password: adminPassword,
      role: Role.admin,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@aisel.test' },
    update: {},
    create: {
      email: 'user@aisel.test',
      password: userPassword,
      role: Role.user,
    },
  });

  const patients = [
    {
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice.martin@example.com',
      phoneNumber: '+33601020304',
      dob: new Date('1985-03-12'),
    },
    {
      firstName: 'Bob',
      lastName: 'Dupont',
      email: 'bob.dupont@example.com',
      phoneNumber: '+33605060708',
      dob: new Date('1990-07-22'),
    },
    {
      firstName: 'Claire',
      lastName: 'Bernard',
      email: 'claire.bernard@example.com',
      phoneNumber: '+33609101112',
      dob: new Date('1978-11-05'),
    },
    {
      firstName: 'David',
      lastName: 'Petit',
      email: 'david.petit@example.com',
      phoneNumber: '+33613141516',
      dob: new Date('2001-01-18'),
    },
    {
      firstName: 'Emma',
      lastName: 'Leroy',
      email: 'emma.leroy@example.com',
      phoneNumber: '+33617181920',
      dob: new Date('1995-09-30'),
    },
  ];

  for (const patient of patients) {
    await prisma.patient.upsert({
      where: { email: patient.email },
      update: patient,
      create: patient,
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
