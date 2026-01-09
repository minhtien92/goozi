import db from '../models/index.js';

class TopicService {
  async getAllTopics(filters = {}) {
    const { isActive } = filters;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const topics = await db.Topic.findAll({
      where,
      include: [
        {
          model: db.TopicTranslation,
          as: 'translations',
          include: [
            {
              model: db.Language,
              as: 'language',
              attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
            },
          ],
          required: false,
        },
      ],
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
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

    // Always include translations
    include.push(
      {
        model: db.TopicTranslation,
        as: 'translations',
        include: [
          {
            model: db.Language,
            as: 'language',
            attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          },
        ],
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
    const { name, description, image, order, isActive, translations } = data;

    if (!name) {
      throw new Error('Topic name is required');
    }

    const topic = await db.Topic.create({
      name,
      description,
      image,
      order: order !== undefined && order !== null ? order : null,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Create translations if provided
    if (translations && Array.isArray(translations) && translations.length > 0) {
      const translationRecords = translations.map((trans) => ({
        topicId: topic.id,
        languageId: trans.languageId,
        meaning: trans.meaning,
        version: trans.version || 1,
        audioUrl: trans.audioUrl || null,
      }));

      await db.TopicTranslation.bulkCreate(translationRecords);
    }

    // Load with translations
    return await db.Topic.findByPk(topic.id, {
      include: [
        {
          model: db.TopicTranslation,
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
    });
  }

  async updateTopic(id, data) {
    const topic = await db.Topic.findByPk(id);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const { name, description, image, order, isActive, translations } = data;

    await topic.update({
      name: name || topic.name,
      description: description !== undefined ? description : topic.description,
      image: image !== undefined ? image : topic.image,
      order: order !== undefined ? (order !== null ? order : null) : topic.order,
      isActive: isActive !== undefined ? isActive : topic.isActive,
    });

    // Update translations if provided
    if (translations && Array.isArray(translations)) {
      // Delete existing translations
      await db.TopicTranslation.destroy({ where: { topicId: topic.id } });

      // Create new translations
      if (translations.length > 0) {
        const translationRecords = translations.map((trans) => ({
          topicId: topic.id,
          languageId: trans.languageId,
          meaning: trans.meaning,
          version: trans.version || 1,
          audioUrl: trans.audioUrl || null,
        }));

        await db.TopicTranslation.bulkCreate(translationRecords);
      }
    }

    // Load with translations
    return await db.Topic.findByPk(topic.id, {
      include: [
        {
          model: db.TopicTranslation,
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

