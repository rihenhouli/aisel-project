import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { PrismaModule } from './prisma/prisma.module';
import { FlakyInterceptor } from './common/interceptors/flaky.interceptor';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    AuthModule,
    PatientsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: FlakyInterceptor,
    },
  ],
})
export class AppModule {}
