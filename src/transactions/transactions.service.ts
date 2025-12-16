import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { FIRESTORE_COLLECTIONS } from '../firebase/firebase.constants';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto, TransactionStatus } from './dto/update-transaction.dto';
import { TransactionFilterDto, TransactionRole } from './dto/transaction-filter.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const firestore = this.firebaseService.getFirestore();

    // Check if book exists
    const bookDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .doc(createTransactionDto.bookId)
      .get();

    if (!bookDoc.exists) {
      throw new NotFoundException('Book not found');
    }

    const bookData = bookDoc.data();
    if (!bookData) {
      throw new NotFoundException('Book not found');
    }

    // Check if buyer is not the seller
    if (bookData.userId === userId) {
      throw new BadRequestException('You cannot create a transaction for your own book');
    }

    // Check if transaction already exists
    const existingTransaction = await firestore
      .collection(FIRESTORE_COLLECTIONS.TRANSACTIONS)
      .where('bookId', '==', createTransactionDto.bookId)
      .where('buyerId', '==', userId)
      .limit(1)
      .get();

    if (!existingTransaction.empty) {
      throw new ConflictException('Transaction already exists for this book');
    }

    const transactionsCollection = firestore.collection(
      FIRESTORE_COLLECTIONS.TRANSACTIONS,
    );
    const transactionDoc = transactionsCollection.doc();
    const now = new Date();

    await transactionDoc.set({
      bookId: createTransactionDto.bookId,
      sellerId: bookData.userId,
      buyerId: userId,
      status: 'negotiating',
      transactionType: createTransactionDto.transactionType,
      agreedPrice: null,
      exchangeDetails: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });

    const sellerInfo = await this.usersService.getPublicProfile(bookData.userId);
    const buyerInfo = await this.usersService.getPublicProfile(userId);

    return {
      id: transactionDoc.id,
      bookId: createTransactionDto.bookId,
      book: {
        id: bookDoc.id,
        title: bookData.title,
        images: bookData.images,
      },
      sellerId: bookData.userId,
      seller: sellerInfo,
      buyerId: userId,
      buyer: buyerInfo,
      status: 'negotiating',
      transactionType: createTransactionDto.transactionType,
      agreedPrice: null,
      exchangeDetails: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: null,
    };
  }

  async findByUserId(userId: string, filterDto: TransactionFilterDto) {
    const firestore = this.firebaseService.getFirestore();
    let query: any = firestore.collection(FIRESTORE_COLLECTIONS.TRANSACTIONS);

    // Filter by role
    if (filterDto.role === TransactionRole.BUYER) {
      query = query.where('buyerId', '==', userId);
    } else if (filterDto.role === TransactionRole.SELLER) {
      query = query.where('sellerId', '==', userId);
    } else {
      // ALL - need to query both buyer and seller separately
      const buyerQuery = firestore
        .collection(FIRESTORE_COLLECTIONS.TRANSACTIONS)
        .where('buyerId', '==', userId);
      const sellerQuery = firestore
        .collection(FIRESTORE_COLLECTIONS.TRANSACTIONS)
        .where('sellerId', '==', userId);

      const [buyerSnapshot, sellerSnapshot] = await Promise.all([
        buyerQuery.get(),
        sellerQuery.get(),
      ]);

      const allDocs = [...buyerSnapshot.docs, ...sellerSnapshot.docs];
      let filteredDocs = allDocs;

      // Apply status filter
      if (filterDto.status) {
        filteredDocs = allDocs.filter(
          (doc) => doc.data().status === filterDto.status,
        );
      }

      // Sort by createdAt descending
      filteredDocs.sort((a, b) => {
        const aTime = a.data().createdAt?.toMillis() || 0;
        const bTime = b.data().createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      const total = filteredDocs.length;
      const page = filterDto.page || 1;
      const limit = filterDto.limit || 20;
      const offset = (page - 1) * limit;

      const paginatedDocs = filteredDocs.slice(offset, offset + limit);

      const transactions = await Promise.all(
        paginatedDocs.map(async (doc) => {
          const data = doc.data();
          const [bookDoc, sellerInfo, buyerInfo] = await Promise.all([
            firestore
              .collection(FIRESTORE_COLLECTIONS.BOOKS)
              .doc(data.bookId)
              .get(),
            this.usersService.getPublicProfile(data.sellerId),
            this.usersService.getPublicProfile(data.buyerId),
          ]);

          const bookData = bookDoc.data();

          return {
            id: doc.id,
            bookId: data.bookId,
            book: {
              id: bookDoc.id,
              title: bookData?.title || '',
              images: bookData?.images || [],
            },
            sellerId: data.sellerId,
            seller: sellerInfo,
            buyerId: data.buyerId,
            buyer: buyerInfo,
            status: data.status,
            transactionType: data.transactionType,
            agreedPrice: data.agreedPrice,
            exchangeDetails: data.exchangeDetails,
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString(),
            completedAt: data.completedAt?.toDate().toISOString() || null,
          };
        }),
      );

      return {
        data: transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Apply status filter for single role
    if (filterDto.status) {
      query = query.where('status', '==', filterDto.status);
    }

    query = query.orderBy('createdAt', 'desc');

    // Get total count
    const allDocs = await query.get();
    const total = allDocs.size;

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;
    const offset = (page - 1) * limit;

    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();
    const transactions: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const [bookDoc, sellerInfo, buyerInfo] = await Promise.all([
        firestore.collection(FIRESTORE_COLLECTIONS.BOOKS).doc(data.bookId).get(),
        this.usersService.getPublicProfile(data.sellerId),
        this.usersService.getPublicProfile(data.buyerId),
      ]);

      const bookData = bookDoc.data();

      transactions.push({
        id: doc.id,
        bookId: data.bookId,
        book: {
          id: bookDoc.id,
          title: bookData?.title || '',
          images: bookData?.images || [],
        },
        sellerId: data.sellerId,
        seller: sellerInfo,
        buyerId: data.buyerId,
        buyer: buyerInfo,
        status: data.status,
        transactionType: data.transactionType,
        agreedPrice: data.agreedPrice,
        exchangeDetails: data.exchangeDetails,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
        completedAt: data.completedAt?.toDate().toISOString() || null,
      });
    }

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(transactionId: string, userId: string) {
    const firestore = this.firebaseService.getFirestore();
    const transactionDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.TRANSACTIONS)
      .doc(transactionId)
      .get();

    if (!transactionDoc.exists) {
      throw new NotFoundException('Transaction not found');
    }

    const data = transactionDoc.data();
    if (!data) {
      throw new NotFoundException('Transaction not found');
    }

    // Check if user is buyer or seller
    if (data.buyerId !== userId && data.sellerId !== userId) {
      throw new ForbiddenException('You are not part of this transaction');
    }

    const [bookDoc, sellerInfo, buyerInfo] = await Promise.all([
      firestore.collection(FIRESTORE_COLLECTIONS.BOOKS).doc(data.bookId).get(),
      this.usersService.getPublicProfile(data.sellerId),
      this.usersService.getPublicProfile(data.buyerId),
    ]);

    const bookData = bookDoc.data();

    return {
      id: transactionDoc.id,
      bookId: data.bookId,
      book: {
        id: bookDoc.id,
        title: bookData?.title || '',
        images: bookData?.images || [],
      },
      sellerId: data.sellerId,
      seller: sellerInfo,
      buyerId: data.buyerId,
      buyer: buyerInfo,
      status: data.status,
      transactionType: data.transactionType,
      agreedPrice: data.agreedPrice,
      exchangeDetails: data.exchangeDetails,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
      completedAt: data.completedAt?.toDate().toISOString() || null,
    };
  }

  async update(
    transactionId: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const firestore = this.firebaseService.getFirestore();
    const transactionRef = firestore
      .collection(FIRESTORE_COLLECTIONS.TRANSACTIONS)
      .doc(transactionId);

    const transactionDoc = await transactionRef.get();
    if (!transactionDoc.exists) {
      throw new NotFoundException('Transaction not found');
    }

    const transactionData = transactionDoc.data();
    if (!transactionData) {
      throw new NotFoundException('Transaction not found');
    }

    // Check if user is buyer or seller
    if (
      transactionData.buyerId !== userId &&
      transactionData.sellerId !== userId
    ) {
      throw new ForbiddenException('You are not part of this transaction');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Validate status transition
    if (updateTransactionDto.status) {
      const currentStatus = transactionData.status;
      const newStatus = updateTransactionDto.status;

      // Define allowed transitions
      const allowedTransitions: Record<string, string[]> = {
        negotiating: ['confirmed'],
        confirmed: ['completed'],
        completed: [],
      };

      if (
        !allowedTransitions[currentStatus]?.includes(newStatus) &&
        currentStatus !== newStatus
      ) {
        throw new BadRequestException(
          `Invalid status transition from ${currentStatus} to ${newStatus}`,
        );
      }

      updateData.status = newStatus;

      // Set completedAt when status is completed
      if (newStatus === TransactionStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }

    if (updateTransactionDto.agreedPrice !== undefined) {
      updateData.agreedPrice = updateTransactionDto.agreedPrice;
    }

    if (updateTransactionDto.exchangeDetails) {
      updateData.exchangeDetails = updateTransactionDto.exchangeDetails;
    }

    await transactionRef.update(updateData);

    const updatedDoc = await transactionRef.get();
    const updatedData = updatedDoc.data();
    if (!updatedData) {
      throw new NotFoundException('Transaction not found');
    }

    const [bookDoc, sellerInfo, buyerInfo] = await Promise.all([
      firestore
        .collection(FIRESTORE_COLLECTIONS.BOOKS)
        .doc(updatedData.bookId)
        .get(),
      this.usersService.getPublicProfile(updatedData.sellerId),
      this.usersService.getPublicProfile(updatedData.buyerId),
    ]);

    const bookData = bookDoc.data();

    return {
      id: updatedDoc.id,
      bookId: updatedData.bookId,
      book: {
        id: bookDoc.id,
        title: bookData?.title || '',
        images: bookData?.images || [],
      },
      sellerId: updatedData.sellerId,
      seller: sellerInfo,
      buyerId: updatedData.buyerId,
      buyer: buyerInfo,
      status: updatedData.status,
      transactionType: updatedData.transactionType,
      agreedPrice: updatedData.agreedPrice,
      exchangeDetails: updatedData.exchangeDetails,
      createdAt: updatedData.createdAt?.toDate().toISOString(),
      updatedAt: updatedData.updatedAt?.toDate().toISOString(),
      completedAt: updatedData.completedAt?.toDate().toISOString() || null,
    };
  }

  async findByBookId(bookId: string, userId: string) {
    const firestore = this.firebaseService.getFirestore();

    // Check if book exists and user is the owner
    const bookDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .doc(bookId)
      .get();

    if (!bookDoc.exists) {
      throw new NotFoundException('Book not found');
    }

    const bookData = bookDoc.data();
    if (!bookData) {
      throw new NotFoundException('Book not found');
    }

    if (bookData.userId !== userId) {
      throw new ForbiddenException('You do not own this book');
    }

    const snapshot = await firestore
      .collection(FIRESTORE_COLLECTIONS.TRANSACTIONS)
      .where('bookId', '==', bookId)
      .orderBy('createdAt', 'desc')
      .get();

    const transactions: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const [sellerInfo, buyerInfo] = await Promise.all([
        this.usersService.getPublicProfile(data.sellerId),
        this.usersService.getPublicProfile(data.buyerId),
      ]);

      transactions.push({
        id: doc.id,
        bookId: data.bookId,
        book: {
          id: bookDoc.id,
          title: bookData.title,
          images: bookData.images,
        },
        sellerId: data.sellerId,
        seller: sellerInfo,
        buyerId: data.buyerId,
        buyer: buyerInfo,
        status: data.status,
        transactionType: data.transactionType,
        agreedPrice: data.agreedPrice,
        exchangeDetails: data.exchangeDetails,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
        completedAt: data.completedAt?.toDate().toISOString() || null,
      });
    }

    return {
      data: transactions,
    };
  }
}
