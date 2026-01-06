import HomeSettingService from '../services/HomeSettingService.js';

class HomeSettingController {
  async getAllSettings(request, reply) {
    try {
      const settings = await HomeSettingService.getAllSettings();
      return reply.send({ settings });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getActiveSettings(request, reply) {
    try {
      const settings = await HomeSettingService.getActiveSettings();
      return reply.send({ settings });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getSettingByKey(request, reply) {
    try {
      const { key } = request.params;
      const setting = await HomeSettingService.getSettingByKey(key);

      if (!setting) {
        return reply.code(404).send({
          error: 'Setting not found',
        });
      }

      return reply.send({ setting });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async createOrUpdateSetting(request, reply) {
    try {
      const { key, value, order, isActive } = request.body;

      if (!key) {
        return reply.code(400).send({
          error: 'Key is required',
        });
      }

      const setting = await HomeSettingService.createOrUpdateSetting(
        key,
        value,
        order,
        isActive
      );

      return reply.send({
        message: 'Setting saved successfully',
        setting: setting.toJSON(),
      });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async updateSetting(request, reply) {
    try {
      const { id } = request.params;
      const setting = await HomeSettingService.updateSetting(id, request.body);

      return reply.send({
        message: 'Setting updated successfully',
        setting: setting.toJSON(),
      });
    } catch (error) {
      if (error.message === 'Setting not found') {
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

  async deleteSetting(request, reply) {
    try {
      const { id } = request.params;
      await HomeSettingService.deleteSetting(id);

      return reply.send({
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Setting not found') {
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

  async bulkUpdateSlogans(request, reply) {
    try {
      const { slogans } = request.body;

      if (!Array.isArray(slogans)) {
        return reply.code(400).send({
          error: 'Slogans must be an array',
        });
      }

      const updatedSlogans = await HomeSettingService.bulkUpdateSlogans(slogans);

      return reply.send({
        message: 'Slogans updated successfully',
        slogans: updatedSlogans,
      });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new HomeSettingController();

