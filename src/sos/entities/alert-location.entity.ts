import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SosAlert } from './sos-alert.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('alert_locations')
export class AlertLocation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: any;

  @Column({ type: 'float', nullable: true })
  accuracy: number;

  @Column({ type: 'float', nullable: true })
  speed: number;

  @Column({ type: 'float', nullable: true })
  heading: number;

  @Column()
  alertId: string;

  @ManyToOne(() => SosAlert, (alert) => alert.locations)
  @JoinColumn({ name: 'alert_id' })
  alert: SosAlert;
}
