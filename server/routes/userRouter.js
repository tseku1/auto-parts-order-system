import express from 'express'
import userAuth from '../middleware/userAuth.js'
import roleAuth from '../middleware/roleAuth.js'
import { getUserData, listAllUsers, updateUserRole, addStaff, removeStaff } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);

// Admin: хэрэглэгч удирдах
userRouter.get('/all', userAuth, roleAuth('admin'), listAllUsers);
userRouter.patch('/:id/role', userAuth, roleAuth('admin'), updateUserRole);
userRouter.post('/staff', userAuth, roleAuth('admin'), addStaff);
userRouter.delete('/staff/:id', userAuth, roleAuth('admin'), removeStaff);

export default userRouter;
