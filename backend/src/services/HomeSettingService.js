import db from '../models/index.js';

class HomeSettingService {
  async getAllSettings() {
    const settings = await db.HomeSetting.findAll({
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    return settings.map((s) => s.toJSON());
  }

  async getSettingByKey(key) {
    const setting = await db.HomeSetting.findOne({
      where: { key, isActive: true },
    });

    return setting ? setting.toJSON() : null;
  }

  async getActiveSettings() {
    const settings = await db.HomeSetting.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    return settings.map((s) => s.toJSON());
  }

  async createOrUpdateSetting(key, value, order = null, isActive = true) {
    const [setting, created] = await db.HomeSetting.findOrCreate({
      where: { key },
      defaults: {
        key,
        value,
        order: order !== null ? order : 0,
        isActive,
      },
    });

    if (!created) {
      await setting.update({
        value,
        order: order !== null ? order : setting.order,
        isActive,
      });
    }

    return setting;
  }

  async createSetting(key, value, order = null, isActive = true) {
    const setting = await db.HomeSetting.create({
      key,
      value,
      order: order !== null ? order : 0,
      isActive,
    });

    return setting;
  }

  async updateSetting(id, data) {
    const setting = await db.HomeSetting.findByPk(id);
    if (!setting) {
      throw new Error('Setting not found');
    }

    const { value, order, isActive } = data;

    await setting.update({
      value: value !== undefined ? value : setting.value,
      order: order !== undefined ? order : setting.order,
      isActive: isActive !== undefined ? isActive : setting.isActive,
    });

    return setting;
  }

  async deleteSetting(id) {
    const setting = await db.HomeSetting.findByPk(id);
    if (!setting) {
      throw new Error('Setting not found');
    }

    await setting.destroy();
    return true;
  }

  async bulkUpdateSlogans(slogans) {
    // Delete existing slogans
    await db.HomeSetting.destroy({
      where: { key: 'slogan' },
    });

    // Create new slogans
    const createdSlogans = [];
    for (let i = 0; i < slogans.length; i++) {
      const slogan = slogans[i];
      if (slogan.value && slogan.value.trim()) {
        const setting = await db.HomeSetting.create({
          key: 'slogan',
          value: slogan.value.trim(),
          order: slogan.order !== undefined ? slogan.order : i,
          isActive: slogan.isActive !== undefined ? slogan.isActive : true,
        });
        createdSlogans.push(setting.toJSON());
      }
    }

    return createdSlogans;
  }
}

export default new HomeSettingService();

