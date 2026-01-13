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
    // Find user (exclude Google OAuth users) - query with password first for verification
    const userWithPassword = await db.User.findOne({ 
      where: { 
        email,
        password: { [Op.ne]: null }, // Must have password (not Google OAuth user)
      },
    });
    
    if (!userWithPassword) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await userWithPassword.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Now get user with all relations but exclude password
    const user = await db.User.findByPk(userWithPassword.id, {
      include: [
        {
          model: db.Language,
          as: 'nativeLanguage',
          attributes: ['id', 'code', 'name', 'nativeName', 'flag'],
          required: false,
        },
      ],
    });

    // Log to debug - check raw data from database
    const rawData = user.get({ plain: true });
    console.log('AuthService.login - Raw user data from DB:', {
      id: rawData.id,
      learningLanguageIds: rawData.learningLanguageIds,
      learningLanguageIdsType: typeof rawData.learningLanguageIds,
      learningLanguageIdsValue: rawData.learningLanguageIds ? JSON.stringify(rawData.learningLanguageIds) : 'null/undefined',
      voiceAccentVersion: rawData.voiceAccentVersion,
      voiceAccentVersionType: typeof rawData.voiceAccentVersion,
      nativeLanguageId: rawData.nativeLanguageId,
      allFields: Object.keys(rawData)
    });
    
    // Check if fields are actually in the database
    const directQuery = await db.sequelize.query(
      `SELECT id, "learningLanguageIds", "voiceAccentVersion" FROM users WHERE id = :userId`,
      {
        replacements: { userId: user.id },
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    console.log('AuthService.login - Direct SQL query result:', directQuery[0]);

    return user;
  }

  async getCurrentUser(userId) {
    // Query without excluding password first to ensure all fields are loaded
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
    
    // Log to debug - check raw data from database
    const rawData = user.get({ plain: true });
    console.log('AuthService.getCurrentUser - Raw user data from DB:', {
      id: rawData.id,
      learningLanguageIds: rawData.learningLanguageIds,
      learningLanguageIdsType: typeof rawData.learningLanguageIds,
      learningLanguageIdsValue: rawData.learningLanguageIds ? JSON.stringify(rawData.learningLanguageIds) : 'null/undefined',
      voiceAccentVersion: rawData.voiceAccentVersion,
      voiceAccentVersionType: typeof rawData.voiceAccentVersion,
      nativeLanguageId: rawData.nativeLanguageId,
      allFields: Object.keys(rawData),
      hasPassword: !!rawData.password
    });
    
    // Check if fields are actually in the database
    const directQuery = await db.sequelize.query(
      `SELECT id, "learningLanguageIds", "voiceAccentVersion" FROM users WHERE id = :userId`,
      {
        replacements: { userId },
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    console.log('AuthService.getCurrentUser - Direct SQL query result:', directQuery[0]);
    
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
        attributes: { exclude: ['password'] }, // Explicitly exclude password, include all other fields
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
          attributes: { exclude: ['password'] }, // Explicitly exclude password, include all other fields
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
        // Reload to ensure JSONB fields are properly loaded
        await user.reload();
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
          attributes: { exclude: ['password'] }, // Explicitly exclude password, include all other fields
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

      // Log to debug
      if (user) {
        const rawData = user.get({ plain: true });
        console.log('AuthService.loginWithGoogle - Raw user data:', {
          id: rawData.id,
          learningLanguageIds: rawData.learningLanguageIds,
          learningLanguageIdsType: typeof rawData.learningLanguageIds,
          learningLanguageIdsValue: JSON.stringify(rawData.learningLanguageIds),
          voiceAccentVersion: rawData.voiceAccentVersion,
          voiceAccentVersionType: typeof rawData.voiceAccentVersion,
          nativeLanguageId: rawData.nativeLanguageId,
          allFields: Object.keys(rawData)
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

