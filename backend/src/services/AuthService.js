import db from '../models/index.js';
import { OAuth2Client } from 'google-auth-library';
import { Op } from 'sequelize';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    // Find user (exclude Google OAuth users)
    const user = await db.User.findOne({ 
      where: { 
        email,
        password: { [Op.ne]: null }, // Must have password (not Google OAuth user)
      },
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

  async loginWithGoogle(idToken) {
    try {
      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!email) {
        throw new Error('Email not provided by Google');
      }

      // Find user by googleId first, then by email
      let user = await db.User.findOne({
        where: { googleId },
        include: [
          {
            model: db.Language,
            as: 'nativeLanguage',
            attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
            required: false,
          },
        ],
      });

      // If not found by googleId, try email
      if (!user) {
        user = await db.User.findOne({
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
      }

      if (user) {
        // Update user if they already exist but don't have googleId
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
        // Update name if needed
        if (name && user.name !== name) {
          user.name = name;
          await user.save();
        }
      } else {
        // Create new user
        user = await db.User.create({
          email,
          name: name || email.split('@')[0],
          googleId,
          password: null, // No password for Google OAuth users
        });

        // Load with language relation
        user = await db.User.findByPk(user.id, {
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

      return user;
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw new Error('Google authentication failed: ' + error.message);
    }
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

