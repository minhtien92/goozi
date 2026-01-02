import db from '../models/index.js';

class VocabularyService {
  async getAllVocabularies(filters = {}) {
    const { topicId, isActive } = filters;
    const where = {};

    if (topicId) {
      where.topicId = topicId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const vocabularies = await db.Vocabulary.findAll({
      where,
      include: [
        {
          model: db.Topic,
          as: 'topic',
          attributes: ['id', 'name'],
        },
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

    return vocabularies.map((v) => v.toJSON());
  }

  async getVocabularyById(id) {
    const vocabulary = await db.Vocabulary.findByPk(id, {
      include: [
        {
          model: db.Topic,
          as: 'topic',
          attributes: ['id', 'name'],
        },
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
    });

    if (!vocabulary) {
      throw new Error('Vocabulary not found');
    }

    return vocabulary;
  }

  async getVocabularyByIdAsJSON(id) {
    const vocabulary = await this.getVocabularyById(id);
    return vocabulary.toJSON ? vocabulary.toJSON() : vocabulary;
  }

  async createVocabulary(data) {
    const { word, topicId, avatar, order, isActive, translations } = data;

    if (!word || !topicId) {
      throw new Error('Word and topicId are required');
    }

    // Verify topic exists
    const topic = await db.Topic.findByPk(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    // Create vocabulary
    const vocabulary = await db.Vocabulary.create({
      word,
      topicId,
      avatar: avatar || null,
      order: order || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Create translations if provided
    if (translations && Array.isArray(translations)) {
      for (const translation of translations) {
        const { languageId, meaning, pronunciation, example, audioUrl, version } = translation;
        
        if (languageId && meaning) {
          // Verify language exists
          const language = await db.Language.findByPk(languageId);
          if (!language) {
            throw new Error(`Language with id ${languageId} not found`);
          }

          await db.VocabularyTranslation.create({
            vocabularyId: vocabulary.id,
            languageId,
            meaning,
            pronunciation: pronunciation || null,
            example: example || null,
            audioUrl: audioUrl || null,
            version: version || 1,
          });
        }
      }
    }

    // Fetch with relations
    return await this.getVocabularyById(vocabulary.id);
  }

  async updateVocabulary(id, data) {
    const vocabulary = await db.Vocabulary.findByPk(id);
    if (!vocabulary) {
      throw new Error('Vocabulary not found');
    }

    const { word, topicId, avatar, order, isActive, translations } = data;

    // If topicId is being updated, verify topic exists
    if (topicId && topicId !== vocabulary.topicId) {
      const topic = await db.Topic.findByPk(topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }
    }

    // Update vocabulary
    await vocabulary.update({
      word: word || vocabulary.word,
      avatar: avatar !== undefined ? avatar : vocabulary.avatar,
      order: order !== undefined ? order : vocabulary.order,
      topicId: topicId || vocabulary.topicId,
      isActive: isActive !== undefined ? isActive : vocabulary.isActive,
    });

    // Update translations if provided
    if (translations && Array.isArray(translations)) {
      // Delete existing translations
      await db.VocabularyTranslation.destroy({
        where: { vocabularyId: id },
      });

      // Create new translations
      for (const translation of translations) {
        const { languageId, meaning, pronunciation, example, audioUrl, version } = translation;
        
        if (languageId && meaning) {
          // Verify language exists
          const language = await db.Language.findByPk(languageId);
          if (!language) {
            throw new Error(`Language with id ${languageId} not found`);
          }

          await db.VocabularyTranslation.create({
            vocabularyId: id,
            languageId,
            meaning,
            pronunciation: pronunciation || null,
            example: example || null,
            audioUrl: audioUrl || null,
            version: version || 1,
          });
        }
      }
    }

    // Fetch with relations
    return await this.getVocabularyById(id);
  }

  async deleteVocabulary(id) {
    const vocabulary = await db.Vocabulary.findByPk(id);
    if (!vocabulary) {
      throw new Error('Vocabulary not found');
    }

    await vocabulary.destroy();
    return true;
  }
}

export default new VocabularyService();

