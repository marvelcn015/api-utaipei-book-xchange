import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { FirebaseService } from '../firebase/firebase.service';
import { FIRESTORE_COLLECTIONS } from '../firebase/firebase.constants';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private firebaseService: FirebaseService) { }

  async findById(userId: string) {
    const firestore = this.firebaseService.getFirestore();
    const userDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new NotFoundException('User not found');
    }

    return {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      department: userData.department,
      studentId: userData.studentId,
      createdAt: userData.createdAt?.toDate().toISOString(),
      updatedAt: userData.updatedAt?.toDate().toISOString(),
    };
  }

  async findByEmail(email: string) {
    const firestore = this.firebaseService.getFirestore();
    const usersCollection = firestore.collection(FIRESTORE_COLLECTIONS.USERS);

    const userSnapshot = await usersCollection
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    return {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      department: userData.department,
      studentId: userData.studentId,
      createdAt: userData.createdAt?.toDate().toISOString(),
      updatedAt: userData.updatedAt?.toDate().toISOString(),
    };
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const firestore = this.firebaseService.getFirestore();
    const userRef = firestore
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(userId);

    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updateUserDto.name) {
      updateData.name = updateUserDto.name;
    }

    if (updateUserDto.department) {
      updateData.department = updateUserDto.department;
    }

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await userRef.update(updateData);

    // Fetch updated user data
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();

    if (!updatedData) {
      throw new NotFoundException('User not found');
    }

    return {
      id: updatedDoc.id,
      email: updatedData.email,
      name: updatedData.name,
      department: updatedData.department,
      studentId: updatedData.studentId,
      createdAt: updatedData.createdAt?.toDate().toISOString(),
      updatedAt: updatedData.updatedAt?.toDate().toISOString(),
    };
  }

  async getPublicProfile(userId: string) {
    const firestore = this.firebaseService.getFirestore();
    const userDoc = await firestore
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new NotFoundException('User not found');
    }

    return {
      id: userDoc.id,
      name: userData.name,
      department: userData.department,
    };
  }
}
