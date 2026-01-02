import db from '../models/index.js';

class AuthService {
  async register(email, password, name, nativeLanguageId = null) {
    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Verify language exists if provided
    if (nativeLanguageId) {
      const language = await db.Language.findByPk(nativeLanguageId);
      if (!language) {
        throw new Error('Native language not found');
      }
    }

    // Create user
    const user = await db.User.create({
      email,
      password,
      name,
      nativeLanguageId,
    });

    // Load with language relation
    return await db.User.findByPk(user.id, {
      include: [
        {
          model: db.Language,
          as: 'nativeLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
        },
      ],
    });
  }

  async login(email, password) {
    // Find user
    const user = await db.User.findOne({ 
      where: { email },
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
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  async getCurrentUser(userId) {
    const user = await db.User.findByPk(userId, {
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
    return user;
  }

  generateToken(fastify, user) {
    return fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}

export default new AuthService();

