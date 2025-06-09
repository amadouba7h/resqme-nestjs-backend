import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty({
    example: 'Je me sens en danger dans cette zone',
    description: 'Description de la situation',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
