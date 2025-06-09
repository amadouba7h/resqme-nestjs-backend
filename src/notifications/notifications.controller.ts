import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('fcm-token')
  @ApiOperation({ summary: 'Update FCM token for push notifications' })
  @ApiResponse({ status: 200, description: 'FCM token updated successfully' })
  async updateFcmToken(@Request() req, @Body('fcmToken') fcmToken: string) {
    // Implement FCM token update logic here
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
    return { message: 'FCM token updated successfully' };
  }

  @Post('test-push')
  @ApiOperation({ summary: 'Send test push notification' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
  })
  async sendTestPush(@Request() req) {
    await this.notificationsService.sendPushNotification(
      req.user.id,
      'Test Notification',
      'This is a test notification',
    );
    return { message: 'Test notification sent successfully' };
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Send test email' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  async sendTestEmail(@Request() req) {
    await this.notificationsService.sendEmail(
      req.user.email,
      'Test Email',
      'This is a test email',
    );
    return { message: 'Test email sent successfully' };
  }
}
