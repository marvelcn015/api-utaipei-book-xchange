import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../books/dto/pagination.dto';

export class TransactionUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  department: string;
}

export class TransactionBookDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [String] })
  images: string[];
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty({ type: TransactionBookDto })
  book: TransactionBookDto;

  @ApiProperty()
  sellerId: string;

  @ApiProperty({ type: TransactionUserDto })
  seller: TransactionUserDto;

  @ApiProperty()
  buyerId: string;

  @ApiProperty({ type: TransactionUserDto })
  buyer: TransactionUserDto;

  @ApiProperty()
  status: string;

  @ApiProperty()
  transactionType: string;

  @ApiProperty({ nullable: true })
  agreedPrice: number | null;

  @ApiProperty({ nullable: true })
  exchangeDetails: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ nullable: true })
  completedAt: string | null;
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}
