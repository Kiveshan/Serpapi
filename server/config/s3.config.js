const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

if (!bucketName) {
  throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
}

// Upload file to S3
const uploadFileToS3 = async (file, userId) => {
  try {
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `publications/registrations/${userId}/${Date.now()}.${fileExtension}`;
    
    // Set up S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private' // Files are private by default
    };
    
    // Upload file to S3
    const uploadResult = await s3.upload(params).promise();
    
    return {
      location: uploadResult.Location,
      key: uploadResult.Key
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

// Get signed URL for file download (if needed later)
const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn
    };
    
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

// Delete file from S3
const deleteFileFromS3 = async (key) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

module.exports = {
  uploadFileToS3,
  getSignedDownloadUrl,
  deleteFileFromS3,
  s3,
  bucketName
};
