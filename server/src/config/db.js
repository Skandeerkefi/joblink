const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    if (isConnected) return mongoose.connection;
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    isConnected = conn.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    isConnected = false;
    throw error;
  }
};

module.exports = connectDB;
