import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateAlertRatingDto {
  @ApiProperty({
    description: 'Identifiant du contact de confiance à évaluer',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  contactId: string;

  @ApiProperty({
    description: 'Note donnée au contact (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: "Commentaire optionnel sur l'aide apportée",
    example: "A réagi rapidement et m'a beaucoup aidé",
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class AlertRatingDto extends CreateAlertRatingDto {
  @ApiProperty({
    description: "Identifiant unique de l'évaluation",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: "Identifiant de l'alerte SOS",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  alertId: string;
}
