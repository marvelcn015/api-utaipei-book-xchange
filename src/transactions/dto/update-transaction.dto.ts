import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

export enum TransactionStatus {
  NEGOTIATING = 'negotiating',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
    description: 'Transaction status',
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    example: 450,
    description: 'Agreed price',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  agreedPrice?: number;

  @ApiPropertyOptional({
    example: 'Exchange for Calculus textbook',
    description: 'Exchange details',
  })
  @IsOptional()
  @IsString()
  exchangeDetails?: string;
}
