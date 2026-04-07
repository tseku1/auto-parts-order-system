import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRouter.js';
import orderRouter from './routes/orderRoutes.js';

const app = express();

const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:4000'];

app.use(express.json());
app.use(cors({origin: allowedOrigins, credentials: true}));
app.use(cookieParser());

// API Endpoints
app.get('/', (req, res) => {
    res.send('API is running successfully');
});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/orders', orderRouter);

app.listen(port, () => {
    console.log(`Server is running on: ${port}`);
});


