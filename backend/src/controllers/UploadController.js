import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UploadController {
  async uploadAudio(request, reply) {
    try {
      // Debug: log request body structure
      console.log('Upload audio - request.body keys:', Object.keys(request.body || {}));
      console.log('Upload audio - request.body.file:', request.body?.file ? 'exists' : 'missing');
      console.log('Upload audio - request.body type:', typeof request.body);
      
      // Get file from body (attachFieldsToBody: true)
      let fileData = request.body?.file;
      
      // Try alternative ways to get file
      if (!fileData && request.body) {
        // Check if file is directly in body
        const bodyKeys = Object.keys(request.body);
        console.log('Upload audio - body keys:', bodyKeys);
        for (const key of bodyKeys) {
          const value = request.body[key];
          if (value && typeof value === 'object' && (value.filename || value.mimetype)) {
            fileData = value;
            console.log('Upload audio - found file in key:', key);
            break;
          }
        }
      }
      
      if (!fileData) {
        console.error('Upload audio - No file found in request.body');
        console.error('Upload audio - request.body:', JSON.stringify(request.body, null, 2));
        return reply.code(400).send({
          error: 'No file uploaded',
        });
      }

      // Get file metadata
      const mimetype = fileData.mimetype;
      const filename = fileData.filename || 'audio.mp3';

      // Validate file type
      const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
      if (mimetype && !allowedMimeTypes.includes(mimetype)) {
        return reply.code(400).send({
          error: 'Invalid file type. Only audio files (mp3, wav, ogg, webm, mp4) are allowed.',
        });
      }

      // Get buffer from file object
      const buffer = await fileData.toBuffer();

      // Generate unique filename
      const fileExtension = filename.split('.').pop() || 'mp3';
      const uniqueFilename = `${randomUUID()}.${fileExtension}`;
      const uploadsDir = join(__dirname, '..', '..', 'uploads', 'audio');
      
      // Create directory if it doesn't exist
      await mkdir(uploadsDir, { recursive: true });

      // Save file
      const filePath = join(uploadsDir, uniqueFilename);
      await writeFile(filePath, buffer);

      // Return file URL
      const fileUrl = `/uploads/audio/${uniqueFilename}`;
      
      return reply.send({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: uniqueFilename,
      });
    } catch (error) {
      console.error('Upload audio error:', error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async uploadImage(request, reply) {
    try {
      // Debug: log request body structure
      console.log('Upload image - request.body keys:', Object.keys(request.body || {}));
      console.log('Upload image - request.body.file:', request.body?.file ? 'exists' : 'missing');
      
      // Get file from body (attachFieldsToBody: true)
      let fileData = request.body?.file;
      
      // Try alternative ways to get file
      if (!fileData && request.body) {
        // Check if file is directly in body
        const bodyKeys = Object.keys(request.body);
        for (const key of bodyKeys) {
          const value = request.body[key];
          if (value && typeof value === 'object' && (value.filename || value.mimetype)) {
            fileData = value;
            console.log('Upload image - found file in key:', key);
            break;
          }
        }
      }
      
      if (!fileData) {
        console.error('Upload image - No file found in request.body');
        return reply.code(400).send({
          error: 'No file uploaded',
        });
      }

      // Get file metadata
      const mimetype = fileData.mimetype;
      const filename = fileData.filename || 'image.jpg';

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (mimetype && !allowedMimeTypes.includes(mimetype)) {
        return reply.code(400).send({
          error: 'Invalid file type. Only image files (jpg, png, gif, webp) are allowed.',
        });
      }

      // Get buffer from file object
      const buffer = await fileData.toBuffer();

      // Generate unique filename
      const fileExtension = filename.split('.').pop() || 'jpg';
      const uniqueFilename = `${randomUUID()}.${fileExtension}`;
      const uploadsDir = join(__dirname, '..', '..', 'uploads', 'images');
      
      // Create directory if it doesn't exist
      await mkdir(uploadsDir, { recursive: true });

      // Save file
      const filePath = join(uploadsDir, uniqueFilename);
      await writeFile(filePath, buffer);

      // Return file URL
      const fileUrl = `/uploads/images/${uniqueFilename}`;
      
      return reply.send({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: uniqueFilename,
      });
    } catch (error) {
      console.error('Upload image error:', error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new UploadController();
