import VocabularyService from '../services/VocabularyService.js';

class VocabularyController {
  async getAllVocabularies(request, reply) {
    try {
      const { topicId, isActive } = request.query;
      const vocabularies = await VocabularyService.getAllVocabularies({ topicId, isActive });

      return reply.send({ vocabularies });
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

      return reply.code(201).send({
        message: 'Vocabulary created successfully',
        vocabulary: vocabulary.toJSON(),
      });
    } catch (error) {
      if (error.message === 'Word, meaning, and topicId are required') {
        return reply.code(400).send({
          error: error.message,
        });
      }
      if (error.message === 'Topic not found') {
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

