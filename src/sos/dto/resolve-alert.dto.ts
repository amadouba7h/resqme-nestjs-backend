import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertResolutionReason } from '../entities/sos-alert.entity';
import { CreateAlertRatingDto } from './alert-rating.dto';

export class ResolveAlertDto {
  @ApiProperty({
    description: "Raison de la résolution de l'alerte",
    enum: AlertResolutionReason,
    example: AlertResolutionReason.SITUATION_RESOLVED,
  })
  @IsEnum(AlertResolutionReason)
  resolutionReason: AlertResolutionReason;

  @ApiProperty({
    description: 'Notes pour les contacts de confiance qui ont aidé',
    type: [CreateAlertRatingDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAlertRatingDto)
  ratings?: CreateAlertRatingDto[];
}
