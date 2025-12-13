import { IsOptional, IsString, IsIn } from 'class-validator';

export class DailyBriefQueryDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsIn(['json', 'markdown'])
  format?: 'json' | 'markdown';
}
