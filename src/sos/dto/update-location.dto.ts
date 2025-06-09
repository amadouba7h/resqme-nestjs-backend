import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ description: 'Latitude de la position', example: 48.8566 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude de la position', example: 2.3522 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Précision de la position en mètres',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiProperty({
    description: 'Vitesse en mètres par seconde',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiProperty({
    description: 'Direction en degrés (0-360)',
    example: 90,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;
}
