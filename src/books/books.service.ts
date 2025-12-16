import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';
import { FIRESTORE_COLLECTIONS } from '../firebase/firebase.constants';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookFilterDto } from './dto/book-filter.dto';

@Injectable()
export class BooksService {
  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {}

  async uploadImages(
    userId: string,
    bookId: string,
    files: Express.Multer.File[],
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed');
    }

    const bucket = this.firebaseService.getStorageBucket();
    const imageUrls: string[] = [];

    for (const file of files) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Image size must not exceed 5MB');
      }

      const timestamp = Date.now();
      const filename = `${timestamp}_${uuidv4()}_${file.originalname}`;
      const filePath = `books/${userId}/${bookId}/${filename}`;

      const fileUpload = bucket.file(filePath);
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      await fileUpload.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      imageUrls.push(publicUrl);
    }

    return imageUrls;
  }

  async deleteImages(imageUrls: string[]): Promise<void> {
    const bucket = this.firebaseService.getStorageBucket();

    for (const url of imageUrls) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const filePath = pathParts.slice(2).join('/');
        await bucket.file(filePath).delete();
      } catch (error) {
        console.error(`Failed to delete image: ${url}`, error);
      }
    }
  }

  async create(userId: string, createBookDto: CreateBookDto, files: Express.Multer.File[]) {
    // Validate price and exchangeWishlist based on type
    if (
      (createBookDto.type === 'sell' || createBookDto.type === 'both') &&
      !createBookDto.price
    ) {
      throw new BadRequestException('Price is required for sell type');
    }

    if (
      (createBookDto.type === 'exchange' || createBookDto.type === 'both') &&
      !createBookDto.exchangeWishlist
    ) {
      throw new BadRequestException(
        'Exchange wishlist is required for exchange type',
      );
    }

    const firestore = this.firebaseService.getFirestore();
    const booksCollection = firestore.collection(FIRESTORE_COLLECTIONS.BOOKS);

    // Create book document first to get ID
    const bookDoc = booksCollection.doc();
    const bookId = bookDoc.id;

    // Upload images
    const imageUrls = await this.uploadImages(userId, bookId, files);

    const now = new Date();
    await bookDoc.set({
      userId,
      title: createBookDto.title,
      description: createBookDto.description,
      department: createBookDto.department,
      course: createBookDto.course,
      condition: createBookDto.condition,
      type: createBookDto.type,
      price: createBookDto.price || null,
      exchangeWishlist: createBookDto.exchangeWishlist || null,
      images: imageUrls,
      status: 'available',
      createdAt: now,
      updatedAt: now,
    });

    const bookData = await bookDoc.get();
    const data = bookData.data();

    if (!data) {
      throw new NotFoundException('Book data not found');
    }

    return {
      id: bookDoc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      department: data.department,
      course: data.course,
      condition: data.condition,
      type: data.type,
      price: data.price,
      exchangeWishlist: data.exchangeWishlist,
      images: data.images,
      status: data.status,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
    };
  }

  async findAll(filterDto: BookFilterDto) {
    const firestore = this.firebaseService.getFirestore();
    let query: any = firestore.collection(FIRESTORE_COLLECTIONS.BOOKS);

    // Apply filters
    if (filterDto.department) {
      query = query.where('department', '==', filterDto.department);
    }

    if (filterDto.course) {
      query = query.where('course', '==', filterDto.course);
    }

    if (filterDto.type) {
      query = query.where('type', '==', filterDto.type);
    }

    if (filterDto.status) {
      query = query.where('status', '==', filterDto.status);
    }

    // Order by createdAt descending
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
    const books: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userInfo = await this.usersService.getPublicProfile(data.userId);

      books.push({
        id: doc.id,
        userId: data.userId,
        userName: userInfo.name,
        userDepartment: userInfo.department,
        title: data.title,
        description: data.description,
        department: data.department,
        course: data.course,
        condition: data.condition,
        type: data.type,
        price: data.price,
        exchangeWishlist: data.exchangeWishlist,
        images: data.images,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      });
    }

    return {
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(bookId: string) {
    const firestore = this.firebaseService.getFirestore();
    const bookDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .doc(bookId)
      .get();

    if (!bookDoc.exists) {
      throw new NotFoundException('Book not found');
    }

    const data = bookDoc.data();

    if (!data) {
      throw new NotFoundException('Book data not found');
    }

    const userInfo = await this.usersService.getPublicProfile(data.userId);

    return {
      id: bookDoc.id,
      userId: data.userId,
      user: userInfo,
      title: data.title,
      description: data.description,
      department: data.department,
      course: data.course,
      condition: data.condition,
      type: data.type,
      price: data.price,
      exchangeWishlist: data.exchangeWishlist,
      images: data.images,
      status: data.status,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
    };
  }

  async update(
    bookId: string,
    userId: string,
    updateBookDto: UpdateBookDto,
    files?: Express.Multer.File[],
  ) {
    const firestore = this.firebaseService.getFirestore();
    const bookRef = firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .doc(bookId);

    const bookDoc = await bookRef.get();
    if (!bookDoc.exists) {
      throw new NotFoundException('Book not found');
    }

    const bookData = bookDoc.data();

    if (!bookData) {
      throw new NotFoundException('Book data not found');
    }

    // Check ownership
    if (bookData.userId !== userId) {
      throw new ForbiddenException('You do not own this book');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update fields if provided
    if (updateBookDto.title) updateData.title = updateBookDto.title;
    if (updateBookDto.description)
      updateData.description = updateBookDto.description;
    if (updateBookDto.department)
      updateData.department = updateBookDto.department;
    if (updateBookDto.course) updateData.course = updateBookDto.course;
    if (updateBookDto.condition !== undefined)
      updateData.condition = updateBookDto.condition;
    if (updateBookDto.type) updateData.type = updateBookDto.type;
    if (updateBookDto.price !== undefined) updateData.price = updateBookDto.price;
    if (updateBookDto.exchangeWishlist)
      updateData.exchangeWishlist = updateBookDto.exchangeWishlist;
    if (updateBookDto.status) updateData.status = updateBookDto.status;

    // Handle image updates
    if (files && files.length > 0) {
      // Delete old images
      await this.deleteImages(bookData.images);

      // Upload new images
      const newImageUrls = await this.uploadImages(userId, bookId, files);
      updateData.images = newImageUrls;
    }

    await bookRef.update(updateData);

    const updatedDoc = await bookRef.get();
    const updatedData = updatedDoc.data();

    if (!updatedData) {
      throw new NotFoundException('Updated book data not found');
    }

    return {
      id: updatedDoc.id,
      userId: updatedData.userId,
      title: updatedData.title,
      description: updatedData.description,
      department: updatedData.department,
      course: updatedData.course,
      condition: updatedData.condition,
      type: updatedData.type,
      price: updatedData.price,
      exchangeWishlist: updatedData.exchangeWishlist,
      images: updatedData.images,
      status: updatedData.status,
      createdAt: updatedData.createdAt?.toDate().toISOString(),
      updatedAt: updatedData.updatedAt?.toDate().toISOString(),
    };
  }

  async delete(bookId: string, userId: string) {
    const firestore = this.firebaseService.getFirestore();
    const bookRef = firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .doc(bookId);

    const bookDoc = await bookRef.get();
    if (!bookDoc.exists) {
      throw new NotFoundException('Book not found');
    }

    const bookData = bookDoc.data();

    if (!bookData) {
      throw new NotFoundException('Book data not found');
    }

    // Check ownership
    if (bookData.userId !== userId) {
      throw new ForbiddenException('You do not own this book');
    }

    // Delete images from storage
    await this.deleteImages(bookData.images);

    // Delete book document
    await bookRef.delete();
  }

  async findByUserId(userId: string, filterDto: BookFilterDto) {
    const firestore = this.firebaseService.getFirestore();
    let query: any = firestore
      .collection(FIRESTORE_COLLECTIONS.BOOKS)
      .where('userId', '==', userId);

    // Apply status filter
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
    const books: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      books.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        department: data.department,
        course: data.course,
        condition: data.condition,
        type: data.type,
        price: data.price,
        exchangeWishlist: data.exchangeWishlist,
        images: data.images,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      });
    }

    return {
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
