import db from '../models/index.js';

class UserService {
  async getAllUsers() {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    return users.map((u) => u.toJSON());
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

    const { email, name, role, nativeLanguageId, permissions } = data;

    // For self-update, only allow updating name and nativeLanguageId
    if (isSelfUpdate) {
      await user.update({
        name: name || user.name,
        nativeLanguageId: nativeLanguageId !== undefined ? nativeLanguageId : user.nativeLanguageId,
      });
    } else {
      // Admin can update everything
      await user.update({
        email: email || user.email,
        name: name || user.name,
        role: role !== undefined ? role : user.role,
        permissions: permissions !== undefined ? permissions : user.permissions,
        nativeLanguageId: nativeLanguageId !== undefined ? nativeLanguageId : user.nativeLanguageId,
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

