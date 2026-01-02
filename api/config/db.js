import mongoose from 'mongoose';

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        // Mongoose 6+ không cần useNewUrlParser và useUnifiedTopology
      })
      .then((conn) => {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
        return conn.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        throw error;
      });
  }

  return connectionPromise;
};

export default connectDB;
