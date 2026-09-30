const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
//This file contains the code to connect to the MongoDB database using Mongoose.