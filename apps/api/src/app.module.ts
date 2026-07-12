import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TenancyModule } from './common/tenancy/tenancy.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { PhotosModule } from './photos/photos.module';
import { GeoModule } from './geo/geo.module';
import { PublicPropertiesModule } from './public-properties/public-properties.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    TenancyModule,
    OrganizationsModule,
    UsersModule,
    PropertiesModule,
    PhotosModule,
    GeoModule,
    PublicPropertiesModule,
  ],
  providers: [
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
})
export class AppModule {}
