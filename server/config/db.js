import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connectDB() {
  try {
    let uri = process.env.MONGODB_URI;

    // Check if we need to use an in-memory database (if no URI provided or it's just the default localhost without a real server)
    if (!uri || uri.includes('localhost') || uri === 'memory') {
      console.log('[v0] Starting In-Memory MongoDB Server for out-of-the-box usage...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`[v0] In-Memory DB started at ${uri}`);
    }

    console.log('[v0] Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[v0] MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('[v0] MongoDB connection error:', error.message);
    process.exit(1);
  }
}

export function disconnectDB() {
  return mongoose.disconnect();
}
