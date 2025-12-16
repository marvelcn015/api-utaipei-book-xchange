import { ApiProperty } from '@nestjs/swagger';
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

export enum BookType {
  SELL = 'sell',
  EXCHANGE = 'exchange',
  BOTH = 'both',
}

export class CreateBookDto {
  @ApiProperty({
    example: 'Introduction to Computer Science',
    description: 'Book title',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Great condition, no markings. Used for one semester.',
    description: 'Book description',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'Department',
  })
  @IsString()
  @MinLength(1)
  department: string;

  @ApiProperty({
    example: 'Introduction to Programming',
    description: 'Course name',
  })
  @IsString()
  @MinLength(1)
  course: string;

  @ApiProperty({
    example: 4,
    description: 'Book condition (1-5, where 5 is best)',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  condition: number;

  @ApiProperty({
    enum: BookType,
    example: BookType.SELL,
    description: 'Transaction type',
  })
  @IsEnum(BookType)
  type: BookType;

  @ApiProperty({
    example: 450,
    description: 'Price in TWD (required if type is sell or both)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    example: 'Looking for Calculus or Linear Algebra textbooks',
    description: 'Exchange wishlist (required if type is exchange or both)',
    required: false,
  })
  @IsOptional()
  @IsString()
  exchangeWishlist?: string;
}
