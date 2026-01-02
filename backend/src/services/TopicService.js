import db from '../models/index.js';

class TopicService {
  async getAllTopics(filters = {}) {
    const { isActive, sourceLanguageId, targetLanguageId } = filters;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (sourceLanguageId) {
      where.sourceLanguageId = sourceLanguageId;
    }

    if (targetLanguageId) {
      where.targetLanguageId = targetLanguageId;
    }

    const topics = await db.Topic.findAll({
      where,
      include: [
        {
          model: db.Language,
          as: 'sourceLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
        {
          model: db.Language,
          as: 'targetLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Get vocabulary counts separately to avoid filtering issues
    const topicsWithCount = await Promise.all(
      topics.map(async (topic) => {
        const vocabCount = await db.Vocabulary.count({
          where: {
            topicId: topic.id,
            isActive: true,
          },
        });
        return {
          ...topic.toJSON(),
          vocabularyCount: vocabCount,
        };
      })
    );

    return topicsWithCount;
  }

  async getTopicById(id, includeVocabularies = false) {
    const include = [];
    
    if (includeVocabularies) {
      include.push({
        model: db.Vocabulary,
        as: 'vocabularies',
        where: { isActive: true },
        required: false,
        include: [
          {
            model: db.VocabularyTranslation,
            as: 'translations',
            include: [
              {
                model: db.Language,
                as: 'language',
                attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
              },
            ],
          },
        ],
        order: [['order', 'ASC'], ['createdAt', 'ASC']],
      });
    }

    // Always include language relations
    include.push(
      {
        model: db.Language,
        as: 'sourceLanguage',
        attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
        required: false,
      },
      {
        model: db.Language,
        as: 'targetLanguage',
        attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
        required: false,
      }
    );

    const topic = await db.Topic.findByPk(id, { include });

    if (!topic) {
      throw new Error('Topic not found');
    }

    return topic;
  }

  async createTopic(data) {
    const { name, description, image, isActive, sourceLanguageId, targetLanguageId } = data;

    if (!name) {
      throw new Error('Topic name is required');
    }

    // Convert empty strings to null for UUID fields
    const normalizedSourceLanguageId = sourceLanguageId && sourceLanguageId.trim() !== '' ? sourceLanguageId : null;
    const normalizedTargetLanguageId = targetLanguageId && targetLanguageId.trim() !== '' ? targetLanguageId : null;

    // Verify languages exist if provided
    if (normalizedSourceLanguageId) {
      const sourceLang = await db.Language.findByPk(normalizedSourceLanguageId);
      if (!sourceLang) {
        throw new Error('Source language not found');
      }
    }

    if (normalizedTargetLanguageId) {
      const targetLang = await db.Language.findByPk(normalizedTargetLanguageId);
      if (!targetLang) {
        throw new Error('Target language not found');
      }
    }

    const topic = await db.Topic.create({
      name,
      description,
      image,
      isActive: isActive !== undefined ? isActive : true,
      sourceLanguageId: normalizedSourceLanguageId,
      targetLanguageId: normalizedTargetLanguageId,
    });

    // Load with language relations
    return await db.Topic.findByPk(topic.id, {
      include: [
        {
          model: db.Language,
          as: 'sourceLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
        {
          model: db.Language,
          as: 'targetLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
      ],
    });
  }

  async updateTopic(id, data) {
    const topic = await db.Topic.findByPk(id);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const { name, description, image, isActive, sourceLanguageId, targetLanguageId } = data;

    // Convert empty strings to null for UUID fields
    const normalizedSourceLanguageId = sourceLanguageId !== undefined 
      ? (sourceLanguageId && sourceLanguageId.trim() !== '' ? sourceLanguageId : null)
      : undefined;
    const normalizedTargetLanguageId = targetLanguageId !== undefined
      ? (targetLanguageId && targetLanguageId.trim() !== '' ? targetLanguageId : null)
      : undefined;

    // Verify languages exist if being updated
    if (normalizedSourceLanguageId !== undefined && normalizedSourceLanguageId !== topic.sourceLanguageId) {
      if (normalizedSourceLanguageId) {
        const sourceLang = await db.Language.findByPk(normalizedSourceLanguageId);
        if (!sourceLang) {
          throw new Error('Source language not found');
        }
      }
    }

    if (normalizedTargetLanguageId !== undefined && normalizedTargetLanguageId !== topic.targetLanguageId) {
      if (normalizedTargetLanguageId) {
        const targetLang = await db.Language.findByPk(normalizedTargetLanguageId);
        if (!targetLang) {
          throw new Error('Target language not found');
        }
      }
    }

    await topic.update({
      name: name || topic.name,
      description: description !== undefined ? description : topic.description,
      image: image !== undefined ? image : topic.image,
      isActive: isActive !== undefined ? isActive : topic.isActive,
      sourceLanguageId: normalizedSourceLanguageId !== undefined ? normalizedSourceLanguageId : topic.sourceLanguageId,
      targetLanguageId: normalizedTargetLanguageId !== undefined ? normalizedTargetLanguageId : topic.targetLanguageId,
    });

    // Load with language relations
    return await db.Topic.findByPk(topic.id, {
      include: [
        {
          model: db.Language,
          as: 'sourceLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
        {
          model: db.Language,
          as: 'targetLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
      ],
    });
  }

  async deleteTopic(id) {
    const topic = await db.Topic.findByPk(id);
    if (!topic) {
      throw new Error('Topic not found');
    }

    await topic.destroy();
    return true;
  }
}

export default new TopicService();

