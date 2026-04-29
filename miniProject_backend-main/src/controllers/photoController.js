const photoService = require('../services/photoService');
const { success, error, validationError } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');
const { enqueueFaceJob } = require('../queue/faceProcessingQueue');

/* PRESIGN */

async function getPresignUrl({ eventId, filename, content_type }) {

  if (!eventId || !filename || !content_type) {
    return validationError(
      [{ field: 'eventId/filename/content_type', message: 'required' }]
    );
  }

  try {

    const { photoId, storage_key, upload_url } =
      await photoService.createPresignedPut(
        eventId,
        filename,
        content_type
      );

    await photoService.createPhotoRecord(
      eventId,
      photoId,
      storage_key
    );

    return success({
      statusCode: HTTP_STATUS.OK,
      message: 'Presigned URL generated',
      data: {
        photo_id: photoId,
        upload_url,
        storage_key,
        headers: { 'Content-Type': content_type }
      }
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to generate presigned URL',
      error: err
    });

  }
}

/* CONFIRM */

async function confirmUpload({ eventId, photo_id, storage_key }) {

  if (!eventId || !photo_id || !storage_key) {
    return validationError(
      [{ field: 'eventId/photo_id/storage_key', message: 'required' }]
    );
  }

  try {

    const result =
      await photoService.confirmPhotoUpload(
        eventId,
        photo_id,
        storage_key
      );

    if (!result) {
      return error({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Photo not found'
      });
    }

    // 🔥 ADD THIS (CRITICAL FIX)
    const jobId = await enqueueFaceJob({
      photoId: photo_id,
      eventId,
      storageKey: storage_key
    });

    return success({
      statusCode: HTTP_STATUS.OK,
      message: 'Photo confirmed',
      data: {
        ...result,
        job_id: jobId   // ✅ NOW NOT NULL
      }
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to confirm upload',
      error: err
    });

  }
}

/* LIST */

async function listPhotos({ eventId }) {

  if (!eventId) {
    return validationError([{ field: 'eventId', message: 'required' }]);
  }

  try {

    const photos = await photoService.listPhotosByEvent(eventId);

    const photosWithUrls = await Promise.all(photos.map(async (photo) => {
      try {
        const presigned = await photoService.getPresignedDownloadUrl(photo.storage_key);
        return {
          ...photo,
          url: presigned.url
        };
      } catch (err) {
        return photo;
      }
    }));

    return success({
      statusCode: HTTP_STATUS.OK,
      message: 'Photos fetched',
      data: { photos: photosWithUrls }
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to fetch photos',
      error: err
    });

  }
}

/* DOWNLOAD */

async function getDownloadUrl({ eventId, photoId }) {

  if (!eventId || !photoId) {
    return validationError(
      [{ field: 'eventId/photoId', message: 'required' }]
    );
  }

  try {

    const photo =
      await photoService.getPhotoById(photoId, eventId);

    if (!photo) {

      return error({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Photo not found'
      });

    }

    const result =
      await photoService.getPresignedDownloadUrl(
        photo.storage_key
      );

    return success({
      statusCode: HTTP_STATUS.OK,
      message: 'Download URL generated',
      data: result
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to generate download URL',
      error: err
    });

  }
}

/* DELETE BULK */
async function deleteBulkPhotos({ eventId }) {
  if (!eventId) {
    return validationError([{ field: 'eventId', message: 'required' }]);
  }

  try {
    const deletedCount = await photoService.deletePhotosByEvent(eventId);
    return success({
      statusCode: HTTP_STATUS.OK,
      message: 'All photos deleted',
      data: { deletedCount }
    });
  } catch (err) {
    return error({
      statusCode: 500,
      message: 'Failed to delete photos',
      error: err
    });
  }
}

/* DELETE SINGLE */
async function deletePhoto({ eventId, photoId }) {
  if (!eventId || !photoId) {
    return validationError([{ field: 'eventId/photoId', message: 'required' }]);
  }

  try {
    const deleted = await photoService.deletePhoto(eventId, photoId);
    if (!deleted) {
      return error({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Photo not found'
      });
    }
    return success({
      statusCode: HTTP_STATUS.OK,
      message: 'Photo deleted'
    });
  } catch (err) {
    return error({
      statusCode: 500,
      message: 'Failed to delete photo',
      error: err
    });
  }
}

module.exports = {
  getPresignUrl,
  confirmUpload,
  listPhotos,
  getDownloadUrl,
  deleteBulkPhotos,
  deletePhoto
};