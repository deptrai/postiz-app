import { IsOptional, IsDateString, IsArray, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DashboardFiltersDto {
  @ApiProperty({ 
    description: 'Start date in YYYY-MM-DD format',
    example: '2025-01-01',
    required: true
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    description: 'End date in YYYY-MM-DD format',
    example: '2025-01-31',
    required: true
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({ 
    description: 'Optional group ID to filter by',
    required: false
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({ 
    description: 'Optional array of integration IDs to filter by',
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  integrationIds?: string[];

  @ApiProperty({ 
    description: 'Content format filter',
    enum: ['post', 'reel', 'all'],
    default: 'all',
    required: false
  })
  @IsOptional()
  @IsEnum(['post', 'reel', 'all'])
  format?: 'post' | 'reel' | 'all';

  @ApiProperty({
    description: 'Limit for top content results',
    default: 10,
    minimum: 1,
    maximum: 50,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
