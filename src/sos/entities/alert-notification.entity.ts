import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SosAlert } from './sos-alert.entity';

export enum NotificationType {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('alert_notifications')
export class AlertNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alert_id', type: 'uuid' })
  alertId: string;

  @ManyToOne(() => SosAlert, (alert) => alert.notifications)
  @JoinColumn({ name: 'alert_id' })
  alert: SosAlert;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    fcmToken?: string;
    email?: string;
    phoneNumber?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
