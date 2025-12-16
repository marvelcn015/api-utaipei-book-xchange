import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum BookStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
}

export enum BookType {
  SELL = 'sell',
  EXCHANGE = 'exchange',
  BOTH = 'both',
}

export class UpdateBookDto {
  @ApiPropertyOptional({
    example: 'Introduction to Computer Science',
    description: 'Book title',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Great condition, no markings.',
    description: 'Book description',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 'Computer Science',
    description: 'Department',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  department?: string;

  @ApiPropertyOptional({
    example: 'Introduction to Programming',
    description: 'Course name',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  course?: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'Book condition (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  condition?: number;

  @ApiPropertyOptional({
    enum: BookType,
    example: BookType.SELL,
    description: 'Transaction type',
  })
  @IsOptional()
  @IsEnum(BookType)
  type?: BookType;

  @ApiPropertyOptional({
    example: 450,
    description: 'Price in TWD',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 'Looking for Calculus textbooks',
    description: 'Exchange wishlist',
  })
  @IsOptional()
  @IsString()
  exchangeWishlist?: string;

  @ApiPropertyOptional({
    enum: BookStatus,
    example: BookStatus.AVAILABLE,
    description: 'Book availability status',
  })
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;
}
