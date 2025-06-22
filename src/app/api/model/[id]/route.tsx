import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/mongo';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate the ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid file ID format' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const collection = db.collection('csv_files');

    const file = await collection.findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          csv_filename: 1,
          financial_model: 1,
          _id: 1
        }
      }
    );

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      file
    });

  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
