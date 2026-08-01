import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/train_booking';
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log(`[MongoDB] Connected successfully to ${mongoURI}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
};
