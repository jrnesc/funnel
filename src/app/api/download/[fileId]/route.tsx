import { NextRequest, NextResponse } from 'next/server';
import { getGridFSBucket } from '../../../utils/mongo';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const bucket = await getGridFSBucket();
    
    // Verify the file exists
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const file = files[0];
    
    // Create a download stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    
    // Convert stream to readable stream for NextResponse
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        const response = new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${file.filename}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
        
        resolve(response);
      });
      
      downloadStream.on('error', (error) => {
        console.error('GridFS download error:', error);
        reject(NextResponse.json(
          { error: 'Failed to download file' },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 