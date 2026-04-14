import mongoose from 'mongoose'

const MONGO_DB_URI = process.env.MONGO_DB_URI!

if (!MONGO_DB_URI) {
  throw new Error('MONGO_DB_URI is not defined in environment variables')
}

// Singleton pattern to reuse connections across hot reloads in development
const globalWithMongoose = global as typeof globalThis & {
  _mongooseConn: typeof mongoose | null
  _mongoosePromise: Promise<typeof mongoose> | null
}

if (!globalWithMongoose._mongooseConn) {
  globalWithMongoose._mongooseConn = null
  globalWithMongoose._mongoosePromise = null
}

export async function connectDB(): Promise<typeof mongoose> {
  // readyState 1 = connected; reuse the cached connection only if still live
  if (globalWithMongoose._mongooseConn && mongoose.connection.readyState === 1) {
    return globalWithMongoose._mongooseConn
  }

  // Reset promise so we reconnect if the previous connection dropped
  if (mongoose.connection.readyState === 0) {
    globalWithMongoose._mongoosePromise = null
  }

  if (!globalWithMongoose._mongoosePromise) {
    globalWithMongoose._mongoosePromise = mongoose.connect(MONGO_DB_URI)
  }

  globalWithMongoose._mongooseConn = await globalWithMongoose._mongoosePromise
  return globalWithMongoose._mongooseConn
}
