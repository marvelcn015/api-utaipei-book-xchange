import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export enum BookType {
  SELL = 'sell',
  EXCHANGE = 'exchange',
  BOTH = 'both',
}

export enum BookStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
}

export class BookFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'Computer Science',
    description: 'Filter by department',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    example: 'Introduction to Programming',
    description: 'Filter by course',
  })
  @IsOptional()
  @IsString()
  course?: string;

  @ApiPropertyOptional({
    enum: BookType,
    example: BookType.SELL,
    description: 'Filter by transaction type',
  })
  @IsOptional()
  @IsEnum(BookType)
  type?: BookType;

  @ApiPropertyOptional({
    enum: BookStatus,
    example: BookStatus.AVAILABLE,
    description: 'Filter by book status',
    default: BookStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus = BookStatus.AVAILABLE;
}
