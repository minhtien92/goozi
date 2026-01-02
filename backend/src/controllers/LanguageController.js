import LanguageService from '../services/LanguageService.js';

class LanguageController {
  async getAllLanguages(request, reply) {
    try {
      const { isActive } = request.query;
      const languages = await LanguageService.getAllLanguages({ isActive });

      return reply.send({ languages });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getLanguageById(request, reply) {
    try {
      const { id } = request.params;
      const language = await LanguageService.getLanguageById(id);

      return reply.send({ language: language.toJSON() });
    } catch (error) {
      if (error.message === 'Language not found') {
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

  async createLanguage(request, reply) {
    try {
      const language = await LanguageService.createLanguage(request.body);

      return reply.code(201).send({
        message: 'Language created successfully',
        language: language.toJSON(),
      });
    } catch (error) {
      if (error.message === 'Code and name are required' || 
          error.message === 'Language code already exists') {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async updateLanguage(request, reply) {
    try {
      const { id } = request.params;
      const language = await LanguageService.updateLanguage(id, request.body);

      return reply.send({
        message: 'Language updated successfully',
        language: language.toJSON(),
      });
    } catch (error) {
      if (error.message === 'Language not found' || 
          error.message === 'Language code already exists') {
        return reply.code(error.message === 'Language not found' ? 404 : 400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async deleteLanguage(request, reply) {
    try {
      const { id } = request.params;
      await LanguageService.deleteLanguage(id);

      return reply.send({
        message: 'Language deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Language not found') {
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

export default new LanguageController();

