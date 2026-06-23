import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PatientsService', () => {
  let service: PatientsService;

  const mockPatients = [
    {
      id: '1',
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      phoneNumber: '+33601020304',
      dob: new Date('1985-03-12'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const prisma = {
    patient: {
      findMany: jest.fn().mockResolvedValue(mockPatients),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PatientsService);
    jest.clearAllMocks();
  });

  it('returns paginated patients with search filter', async () => {
    const result = await service.findAll({
      search: 'alice',
      page: 1,
      limit: 10,
      sortBy: 'lastName',
      sortOrder: 'asc',
    });

    expect(prisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
        skip: 0,
        take: 10,
        orderBy: { lastName: 'asc' },
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
  });
});
