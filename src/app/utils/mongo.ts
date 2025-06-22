import { MongoClient, ServerApiVersion, GridFSBucket } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/funnel';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function connectToDatabase() {
  try {
    await client.connect();
    return client.db('funnel');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getGridFSBucket() {
  const db = await connectToDatabase();
  return new GridFSBucket(db, { bucketName: 'fs' });
}

export async function closeDatabaseConnection() {
  await client.close();
}