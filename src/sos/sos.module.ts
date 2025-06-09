import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosService } from './sos.service';
import { SosController } from './sos.controller';
import { SosGateway } from './sos.gateway';
import { SosAlert } from './entities/sos-alert.entity';
import { AlertLocation } from './entities/alert-location.entity';
import { AlertNotification } from './entities/alert-notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SosAlert, AlertLocation, AlertNotification]),
    NotificationsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [SosController],
  providers: [SosService, SosGateway],
  exports: [SosService],
})
export class SosModule {}
