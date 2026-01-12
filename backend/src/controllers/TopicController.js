import TopicService from '../services/TopicService.js';

class TopicController {
  async getAllTopics(request, reply) {
    try {
      const { isActive, sourceLanguageId, targetLanguageId, page, limit } = request.query;
      const result = await TopicService.getAllTopics({ 
        isActive, 
        sourceLanguageId, 
        targetLanguageId,
        page,
        limit,
      });

      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getTopicById(request, reply) {
    try {
      const { id } = request.params;
      const topic = await TopicService.getTopicById(id, true);

      // Use get({ plain: true }) for better serialization with includes
      const topicData = topic.get ? topic.get({ plain: true }) : (topic.toJSON ? topic.toJSON() : {});
      
      return reply.send({ topic: topicData });
    } catch (error) {
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

  async createTopic(request, reply) {
    try {
      const topic = await TopicService.createTopic(request.body);

      return reply.code(201).send({
        message: 'Topic created successfully',
        topic: topic.toJSON(),
      });
    } catch (error) {
      if (error.message === 'Topic name is required') {
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

  async updateTopic(request, reply) {
    try {
      const { id } = request.params;
      const topic = await TopicService.updateTopic(id, request.body);

      return reply.send({
        message: 'Topic updated successfully',
        topic: topic.toJSON(),
      });
    } catch (error) {
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

  async deleteTopic(request, reply) {
    try {
      const { id } = request.params;
      await TopicService.deleteTopic(id);

      return reply.send({
        message: 'Topic deleted successfully',
      });
    } catch (error) {
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
}

export default new TopicController();

