import VocabularyService from '../services/VocabularyService.js';

class VocabularyController {
  async getAllVocabularies(request, reply) {
    try {
      const { topicId, isActive, page, limit } = request.query;
      const result = await VocabularyService.getAllVocabularies({ topicId, isActive, page, limit });

      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getVocabularyById(request, reply) {
    try {
      const { id } = request.params;
      const vocabulary = await VocabularyService.getVocabularyById(id);

      return reply.send({ vocabulary: vocabulary.toJSON() });
    } catch (error) {
      if (error.message === 'Vocabulary not found') {
        return reply.code(404).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async createVocabulary(request, reply) {
    try {
      const vocabulary = await VocabularyService.createVocabulary(request.body);
      
      // Convert to JSON safely
      const vocabularyJSON = vocabulary.toJSON ? vocabulary.toJSON() : vocabulary;

      return reply.code(201).send({
        message: 'Vocabulary created successfully',
        vocabulary: vocabularyJSON,
      });
    } catch (error) {
      // Log error for debugging
      request.log.error('Error creating vocabulary:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        body: request.body,
        topicId: request.body?.topicId,
      });
      
      // Also log to console for easier debugging
      console.error('Error creating vocabulary:', {
        message: error.message,
        topicId: request.body?.topicId,
        error: error,
      });
      
      if (error.message === 'Word and topicId are required') {
        return reply.code(400).send({
          error: error.message,
        });
      }
      if (error.message === 'Topic not found') {
        return reply.code(404).send({
          error: error.message,
        });
      }
      if (error.message && error.message.includes('Language with id')) {
        return reply.code(404).send({
          error: error.message,
        });
      }
      // Check for unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === '23505') {
        return reply.code(400).send({
          error: 'Duplicate translation: A translation with the same language and version already exists for this vocabulary',
          message: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  async updateVocabulary(request, reply) {
    try {
      const { id } = request.params;
      const vocabulary = await VocabularyService.updateVocabulary(id, request.body);

      return reply.send({
        message: 'Vocabulary updated successfully',
        vocabulary: vocabulary.toJSON(),
      });
    } catch (error) {
      if (error.message === 'Vocabulary not found' || error.message === 'Topic not found') {
        return reply.code(404).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async deleteVocabulary(request, reply) {
    try {
      const { id } = request.params;
      await VocabularyService.deleteVocabulary(id);

      return reply.send({
        message: 'Vocabulary deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Vocabulary not found') {
        return reply.code(404).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new VocabularyController();

