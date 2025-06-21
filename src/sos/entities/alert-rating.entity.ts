import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SosAlert } from './sos-alert.entity';
import { TrustedContact } from '../../users/entities/trusted-contact.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('alert_ratings')
export class AlertRating extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: "Identifiant unique de l'évaluation",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({ name: 'alert_id' })
  @ApiProperty({
    description: "Identifiant de l'alerte SOS",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  alertId: string;

  @ManyToOne(() => SosAlert)
  @JoinColumn({ name: 'alert_id' })
  alert: SosAlert;

  @Column({ name: 'trusted_contact_id', type: 'uuid', nullable: true })
  @ApiProperty({
    description: 'Identifiant du contact de confiance évalué (optionnel)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  trustedContactId?: string;

  @ManyToOne(() => TrustedContact, { nullable: true })
  @JoinColumn({ name: 'trusted_contact_id' })
  trustedContact?: TrustedContact;

  @Column({ type: 'integer', nullable: false })
  @ApiProperty({
    description: 'Note donnée au contact (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: "Commentaire optionnel sur l'aide apportée",
    example: "A réagi rapidement et m'a beaucoup aidé",
  })
  comment?: string;
}
