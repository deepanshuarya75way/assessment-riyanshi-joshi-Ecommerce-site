import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn(
      '[db] MONGO_URI is not set. Add your MongoDB connection string to server/.env to enable database features.'
    );
    return;
  }

  try {
    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected Successfully: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;
