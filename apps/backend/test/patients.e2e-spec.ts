import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Role } from "@prisma/client";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Patients RBAC (e2e)", () => {
  let app: INestApplication;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    patient: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({
        id: "p1",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phoneNumber: "+33600000000",
        dob: new Date("1990-01-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
    $connect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // NOTE: JWT is generated directly for test isolation.
  // Auth flow is tested separately in unit/integration tests.

  it("returns 403 when user role tries to create patient", async () => {
    const { JwtService } = await import("@nestjs/jwt");
    const jwt = app.get(JwtService);
    const userToken = await jwt.signAsync({
      sub: "u1",
      email: "user@aisel.test",
      role: Role.user,
    });

    await request(app.getHttpServer())
      .post("/patients")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phoneNumber: "+33600000000",
        dob: "1990-01-01",
      })
      .expect(403);
  });

  it("returns 201 when admin creates patient", async () => {
    const { JwtService } = await import("@nestjs/jwt");
    const jwt = app.get(JwtService);
    const adminToken = await jwt.signAsync({
      sub: "a1",
      email: "admin@aisel.test",
      role: Role.admin,
    });

    await request(app.getHttpServer())
      .post("/patients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phoneNumber: "+33600000000",
        dob: "1990-01-01",
      })
      .expect(201);
  });
});
