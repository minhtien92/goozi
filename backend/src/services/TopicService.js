import db from '../models/index.js';

class TopicService {
  async getAllTopics(filters = {}) {
    const { isActive, page, limit } = filters;
    const where = {};

    if (isActive !== undefined) {
      // Handle both string 'true'/'false' and boolean true/false
      if (typeof isActive === 'string') {
        where.isActive = isActive === 'true' || isActive === '1';
      } else {
        where.isActive = Boolean(isActive);
      }
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Count total items separately to avoid issues with distinct and includes
    const totalCount = await db.Topic.count({ where });

    const rows = await db.Topic.findAll({
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
      limit: limitNum,
      offset: offset,
    });

    // Get vocabulary counts separately to avoid filtering issues
    const topicsWithCount = await Promise.all(
      rows.map(async (topic) => {
        const vocabCount = await db.Vocabulary.count({
          where: {
            topicId: topic.id,
            isActive: true,
          },
        });
        // Use get({ plain: true }) for better serialization with includes
        let topicData = topic.get ? topic.get({ plain: true }) : (topic.toJSON ? topic.toJSON() : {});
        // Ensure topicData is a proper object
        if (!topicData || typeof topicData !== 'object') {
          topicData = {};
        }
        // Manually construct the object to avoid spread issues
        const result = {
          id: topicData.id,
          name: topicData.name,
          description: topicData.description,
          image: topicData.image,
          order: topicData.order,
          isActive: topicData.isActive,
          createdAt: topicData.createdAt,
          updatedAt: topicData.updatedAt,
          translations: topicData.translations || [],
          vocabularyCount: vocabCount,
        };
        return result;
      })
    );

    return {
      topics: topicsWithCount,
      pagination: {
        totalItems: totalCount,
        totalPages: totalCount > 0 ? Math.ceil(totalCount / limitNum) : 1,
        currentPage: pageNum,
        itemsPerPage: limitNum,
      },
    };
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

