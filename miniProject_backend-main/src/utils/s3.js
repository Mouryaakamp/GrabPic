const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
  } = require('@aws-sdk/client-s3');
  
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  
  const { S3_BUCKET, PRESIGN_EXPIRES_IN } = require('../config/constants');
  
  let s3 = null;
  
  /* CLIENT */
  
  function getS3Client() {
    if (!s3) {
      s3 = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1'
      });
    }
    return s3;
  }
  
  /* HELPERS */
  
  function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  }
  
  function buildPhotoKey(eventId, photoId, fileName) {
    const safe = sanitizeFileName(fileName);
    return `events/${eventId}/photos/${photoId}/${safe}`;
  }
  
  /* PRESIGNED PUT */
  
  async function getPresignedPutUrl(key, contentType) {
  
    const client = getS3Client();
  
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      // ContentType: contentType
    });
  
    return getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRES_IN
    });
  }
  
  /* PRESIGNED GET */
  
  async function getPresignedDownloadUrl(key) {
  
    const client = getS3Client();
  
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key
    });
  
    const url = await getSignedUrl(client, command, {
      expiresIn: 3600
    });
  
    return {
      url,
      expires_in: 3600
    };
  }
  
  module.exports = {
    buildPhotoKey,
    getPresignedPutUrl,
    getPresignedDownloadUrl
  };