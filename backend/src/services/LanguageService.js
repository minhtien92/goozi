import db from '../models/index.js';

class LanguageService {
  async getAllLanguages(filters = {}) {
    const { isActive } = filters;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const languages = await db.Language.findAll({
      where,
      order: [['name', 'ASC']],
    });

    return languages.map((lang) => lang.toJSON());
  }

  async getLanguageById(id) {
    const language = await db.Language.findByPk(id);
    if (!language) {
      throw new Error('Language not found');
    }
    return language;
  }

  async getLanguageByCode(code) {
    const language = await db.Language.findOne({ where: { code } });
    if (!language) {
      throw new Error('Language not found');
    }
    return language;
  }

  async createLanguage(data) {
    const { code, name, nativeName, flag, isActive } = data;

    if (!code || !name) {
      throw new Error('Code and name are required');
    }

    // Check if code already exists
    const existing = await db.Language.findOne({ where: { code } });
    if (existing) {
      throw new Error('Language code already exists');
    }

    const language = await db.Language.create({
      code,
      name,
      nativeName,
      flag,
      isActive: isActive !== undefined ? isActive : true,
    });

    return language;
  }

  async updateLanguage(id, data) {
    const language = await db.Language.findByPk(id);
    if (!language) {
      throw new Error('Language not found');
    }

    const { code, name, nativeName, flag, isActive } = data;

    // Check if code is being changed and already exists
    if (code && code !== language.code) {
      const existing = await db.Language.findOne({ where: { code } });
      if (existing) {
        throw new Error('Language code already exists');
      }
    }

    await language.update({
      code: code || language.code,
      name: name || language.name,
      nativeName: nativeName !== undefined ? nativeName : language.nativeName,
      flag: flag !== undefined ? flag : language.flag,
      isActive: isActive !== undefined ? isActive : language.isActive,
    });

    return language;
  }

  async deleteLanguage(id) {
    const language = await db.Language.findByPk(id);
    if (!language) {
      throw new Error('Language not found');
    }

    await language.destroy();
    return true;
  }
}

export default new LanguageService();

