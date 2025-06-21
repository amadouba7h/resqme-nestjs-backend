import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AlertLocation } from './alert-location.entity';
import { AlertNotification } from './alert-notification.entity';
import { AlertRating } from './alert-rating.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export enum AlertResolutionReason {
  SITUATION_RESOLVED = 'situation_resolved',
  FALSE_ALARM = 'false_alarm',
}

@Entity('sos_alerts')
export class SosAlert extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.alerts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @OneToMany(() => AlertRating, (rating) => rating.alert)
  ratings: AlertRating[];

  @Column({
    name: 'resolution_reason',
    type: 'enum',
    enum: AlertResolutionReason,
    nullable: true,
  })
  resolutionReason: AlertResolutionReason;

  @Column({ name: 'expired_at', type: 'timestamp', nullable: true })
  expiredAt: Date;

  @OneToMany(() => AlertLocation, (location) => location.alert)
  locations: AlertLocation[];

  @OneToMany(() => AlertNotification, (notification) => notification.alert)
  notifications: AlertNotification[];
}
