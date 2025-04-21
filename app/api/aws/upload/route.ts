import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Initialize S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json(
      { message: 'No file uploaded' },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || 'rhyme',
      Key: `audio/${Date.now()}-${file.name}`,
      Body: buffer,
      ContentType: file.type || 'audio/mpeg',
    };

    const data = await s3.upload(params).promise();
    return NextResponse.json({ url: data.Location });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json(
      { message: 'Upload to S3 failed' },
      { status: 500 }
    );
  }
}