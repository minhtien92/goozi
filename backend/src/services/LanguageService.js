import db from '../models/index.js';

class LanguageService {
  async getAllLanguages(filters = {}) {
    const { isActive, page, limit } = filters;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // If no pagination parameters provided -> return full list (no pagination)
    if (!page && !limit) {
      const rows = await db.Language.findAll({
        where,
        order: [
          ['order', 'ASC'],
          ['name', 'ASC'],
        ],
      });

      return {
        languages: rows.map((lang) => lang.toJSON()),
      };
    }

    // With pagination (used where explicitly requested)
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await db.Language.findAndCountAll({
      where,
      order: [
        ['order', 'ASC'],
        ['name', 'ASC'],
      ],
      limit: limitNum,
      offset: offset,
    });

    // Ensure count is a number
    const totalCount = parseInt(count) || 0;

    return {
      languages: rows.map((lang) => lang.toJSON()),
      pagination: {
        totalItems: totalCount,
        totalPages: totalCount > 0 ? Math.ceil(totalCount / limitNum) : 1,
        currentPage: pageNum,
        itemsPerPage: limitNum,
      },
    };
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

  async updateOrder(orderData) {
    if (!Array.isArray(orderData)) {
      throw new Error('Invalid order data');
    }

    await db.sequelize.transaction(async (transaction) => {
      for (const item of orderData) {
        if (!item.id || typeof item.order !== 'number') {
          continue;
        }

        await db.Language.update(
          { order: item.order },
          {
            where: { id: item.id },
            transaction,
          }
        );
      }
    });

    // Return updated list
    const languages = await db.Language.findAll({
      order: [
        ['order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return {
      message: 'Order updated successfully',
      languages: languages.map((lang) => lang.toJSON()),
    };
  }
}

export default new LanguageService();

