const multer = require('multer');
const { uploadFileToS3 } = require('../config/s3.config');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for PDF and Word documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Middleware to handle single file upload for registration
const uploadCertificate = async (req, res, next) => {
  try {
    // Use multer to handle the file upload
    upload.single('certificate')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
          }
          return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        return res.status(400).json({ error: err.message });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'Certificate file is required for registration' });
      }
      
      try {
        // Generate a unique ID for the upload path
        const uploadId = 'pending_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const uploadResult = await uploadFileToS3(req.file, uploadId);
        
        // Add file info to request object
        req.certificateFile = {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          s3Location: uploadResult.location,
          s3Key: uploadResult.key,
          uploadId: uploadId // Store the temporary upload ID
        };
        
        next();
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload certificate file' });
      }
    });
  } catch (error) {
    console.error('Upload middleware error:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
};

// Middleware to update S3 file path after user creation
const updateCertificatePath = async (req, res, next) => {
  try {
    if (req.certificateFile && req.user && req.user.userid) {
      const { uploadFileToS3, deleteFileFromS3 } = require('../config/s3.config');
      
      // Re-upload with correct user ID
      const fileBuffer = req.file ? req.file.buffer : null;
      if (!fileBuffer) {
        console.error('No file buffer available for re-upload');
        return next();
      }
      
      // Create a temporary file object for re-upload
      const tempFile = {
        buffer: fileBuffer,
        originalname: req.certificateFile.originalName,
        mimetype: req.certificateFile.mimeType
      };
      
      const newUploadResult = await uploadFileToS3(tempFile, req.user.userid);
      
      // Delete old file
      await deleteFileFromS3(req.certificateFile.s3Key);
      
      // Update certificate file info
      req.certificateFile.s3Location = newUploadResult.location;
      req.certificateFile.s3Key = newUploadResult.key;
      
      // Update the certificatelink in database
      const { updateUser } = require('../model/auth/auth.model');
      await updateUser(req.user.userid, {
        certificatelink: newUploadResult.location
      });
    }
    
    next();
  } catch (error) {
    console.error('Update certificate path error:', error);
    // Don't fail the request, just log the error
    next();
  }
};

module.exports = {
  uploadCertificate,
  updateCertificatePath,
  upload // Export multer instance for potential direct use
};
