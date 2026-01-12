import db from '../models/index.js';

class UserService {
  async getAllUsers(filters = {}) {
    const { page, limit } = filters;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await db.User.findAndCountAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset,
    });

    // Ensure count is a number
    const totalCount = parseInt(count) || 0;

    return {
      users: rows.map((u) => u.toJSON()),
      pagination: {
        totalItems: totalCount,
        totalPages: totalCount > 0 ? Math.ceil(totalCount / limitNum) : 1,
        currentPage: pageNum,
        itemsPerPage: limitNum,
      },
    };
  }

  async getUserById(id) {
    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id, data, isSelfUpdate = false) {
    const user = await db.User.findByPk(id, {
      include: [
        {
          model: db.Language,
          as: 'nativeLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
      ],
    });
    if (!user) {
      throw new Error('User not found');
    }

    const { email, name, role, nativeLanguageId, permissions, voiceAccentVersion, learningLanguageIds } = data;

    // For self-update, only allow updating name, nativeLanguageId, voiceAccentVersion, and learningLanguageIds
    if (isSelfUpdate) {
      await user.update({
        name: name || user.name,
        nativeLanguageId: nativeLanguageId !== undefined ? nativeLanguageId : user.nativeLanguageId,
        voiceAccentVersion: voiceAccentVersion !== undefined ? voiceAccentVersion : user.voiceAccentVersion,
        learningLanguageIds: learningLanguageIds !== undefined ? learningLanguageIds : user.learningLanguageIds,
      });
    } else {
      // Admin can update everything
      await user.update({
        email: email || user.email,
        name: name || user.name,
        role: role !== undefined ? role : user.role,
        permissions: permissions !== undefined ? permissions : user.permissions,
        nativeLanguageId: nativeLanguageId !== undefined ? nativeLanguageId : user.nativeLanguageId,
        voiceAccentVersion: voiceAccentVersion !== undefined ? voiceAccentVersion : user.voiceAccentVersion,
        learningLanguageIds: learningLanguageIds !== undefined ? learningLanguageIds : user.learningLanguageIds,
      });
    }

    // Reload with language relation
    return await db.User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.Language,
          as: 'nativeLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
      ],
    });
  }

  async deleteUser(id) {
    const user = await db.User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.destroy();
    return true;
  }

  async createUser(data) {
    const { email, password, name, role = 'user', nativeLanguageId, permissions } = data;

    // Check if user already exists
    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const user = await db.User.create({
      email,
      password,
      name,
      role,
      nativeLanguageId: nativeLanguageId || null,
      permissions: permissions || null,
    });

    return await db.User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
    });
  }
}

export default new UserService();

