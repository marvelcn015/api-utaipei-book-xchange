import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum TransactionType {
  SELL = 'sell',
  EXCHANGE = 'exchange',
}

export class CreateTransactionDto {
  @ApiProperty({
    example: 'book-id-123',
    description: 'Book ID',
  })
  @IsString()
  bookId: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.SELL,
    description: 'Transaction type',
  })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiPropertyOptional({
    example: 'I am interested in this book',
    description: 'Optional initial message',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
