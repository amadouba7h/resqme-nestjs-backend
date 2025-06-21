import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosService } from './sos.service';
import { SosController } from './sos.controller';
import { SosAlert } from './entities/sos-alert.entity';
import { AlertLocation } from './entities/alert-location.entity';
import { AlertNotification } from './entities/alert-notification.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AlertRatingService } from './services/alert-rating.service';
import { AlertRating } from './entities/alert-rating.entity';
import { SosGateway } from './sos.gateway';
import { User } from 'src/users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { TrustedContact } from 'src/users/entities/trusted-contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SosAlert,
      AlertLocation,
      AlertNotification,
      AlertRating,
      User,
      TrustedContact,
    ]),
    UsersModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    JwtModule,
  ],
  controllers: [SosController],
  providers: [SosService, AlertRatingService, SosGateway],
  exports: [SosService],
})
export class SosModule {}
