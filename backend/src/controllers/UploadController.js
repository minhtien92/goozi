import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class UploadController {
  async uploadAudio(request, reply) {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: 'Invalid file type. Only audio files (mp3, wav, ogg, webm, mp4) are allowed.',
        });
      }

      // Generate unique filename
      const fileExtension = data.filename.split('.').pop() || 'mp3';
      const filename = `${randomUUID()}.${fileExtension}`;
      const uploadsDir = join(__dirname, '..', '..', 'uploads', 'audio');
      
      // Create directory if it doesn't exist
      await mkdir(uploadsDir, { recursive: true });

      // Save file
      const filePath = join(uploadsDir, filename);
      const buffer = await data.toBuffer();
      await writeFile(filePath, buffer);

      // Return file URL
      const fileUrl = `/uploads/audio/${filename}`;
      
      return reply.send({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: filename,
      });
    } catch (error) {
      console.error('Upload error:', error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async uploadImage(request, reply) {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: 'Invalid file type. Only image files (jpg, png, gif, webp) are allowed.',
        });
      }

      // Generate unique filename
      const fileExtension = data.filename.split('.').pop() || 'jpg';
      const filename = `${randomUUID()}.${fileExtension}`;
      const uploadsDir = join(__dirname, '..', '..', 'uploads', 'images');
      
      // Create directory if it doesn't exist
      await mkdir(uploadsDir, { recursive: true });

      // Save file
      const filePath = join(uploadsDir, filename);
      const buffer = await data.toBuffer();
      await writeFile(filePath, buffer);

      // Return file URL
      const fileUrl = `/uploads/images/${filename}`;
      
      return reply.send({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: filename,
      });
    } catch (error) {
      console.error('Upload error:', error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new UploadController();

