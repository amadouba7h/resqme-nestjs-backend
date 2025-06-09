import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { SosAlert } from '../sos/entities/sos-alert.entity';
import { AlertLocation } from '../sos/entities/alert-location.entity';
import { AlertNotification } from '../sos/entities/alert-notification.entity';
import { TrustedContact } from '../users/entities/trusted-contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      SosAlert,
      AlertLocation,
      AlertNotification,
      TrustedContact,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
