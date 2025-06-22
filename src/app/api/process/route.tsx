import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../utils/mongo';

export async function GET() {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('csv_files');

    const files = await collection.find({}).toArray();

    return NextResponse.json({
      success: true,
      files
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }
    
    const conversionFormData = new FormData();
    conversionFormData.append('file', file);
    
    const conversionResponse = await fetch('http://127.0.0.1:8000/analyze-financials', {
      method: 'POST',
      body: conversionFormData,
    });

    if (!conversionResponse.ok) {
      throw new Error(`Conversion service error: ${conversionResponse.status}`);
    }

    const conversionResult = await conversionResponse.json();
    
    if (conversionResult.error) {
      return NextResponse.json(
        { error: `Conversion failed: ${conversionResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
