import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePatientDto,
  QueryPatientsDto,
  UpdatePatientDto,
} from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...patient,
      dob: patient.dob.toISOString().split('T')[0],
    };
  }

  async findAll(query: QueryPatientsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'lastName';
    const sortOrder = query.sortOrder ?? 'asc';

    const where: Prisma.PatientWhereInput = query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: data.map((p) => this.serialize(p)),
      page,
      limit,
      total,
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    return this.serialize(patient);
  }

  async create(dto: CreatePatientDto) {
    const patient = await this.prisma.patient.create({
      data: {
        ...dto,
        dob: new Date(dto.dob),
      },
    });
    return this.serialize(patient);
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOne(id);
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dob ? { dob: new Date(dto.dob) } : {}),
      },
    });
    return this.serialize(patient);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.patient.delete({ where: { id } });
    return { ok: true };
  }
}
