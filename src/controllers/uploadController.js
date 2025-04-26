import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Upload single file to S3
export const uploadSingleFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log('Uploading file to S3...');

  const fileName = `backgrounds/${Date.now()}-${req.file.originalname.replace(/\s+/g, "-")}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: 'public-read'
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading to S3:', err);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
    
    res.json({ url: data.Location });
  });
};

// Upload multiple files to S3
export const uploadMultipleFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  console.log(`Uploading ${req.files.length} files to S3...`);
  
  try {
    const uploadPromises = req.files.map(file => {
      const fileName = `products/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
      
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      };
      
      return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
          if (err) {
            console.error('Error uploading to S3:', err);
            reject(err);
          } else {
            resolve(data.Location);
          }
        });
      });
    });
    
    const uploadedUrls = await Promise.all(uploadPromises);
    
    res.json({ 
      success: true,
      count: uploadedUrls.length,
      urls: uploadedUrls 
    });
  } catch (error) {
    console.error('Error in multi-upload:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload one or more files' 
    });
  }
};
