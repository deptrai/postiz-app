import { IsArray, IsString, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTrackedPagesDto {
  @ApiProperty({
    description: 'Array of integration IDs to track for analytics (max 20)',
    type: [String],
    example: ['int-123', 'int-456'],
    maxItems: 20,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20, { message: 'Cannot track more than 20 integrations' })
  integrationIds!: string[];
}
