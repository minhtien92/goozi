import AuthService from '../services/AuthService.js';

class AuthController {
  normalizePermissions(userJson) {
    // If not admin, return as-is
    if (userJson.role !== 'admin') return userJson;
    const perms = userJson.permissions || {};
    userJson.permissions = {
      topics: perms.topics === true,
      vocabularies: perms.vocabularies === true,
      home: perms.home === true,
      users: perms.users === true,
    };
    return userJson;
  }

  async register(request, reply) {
    try {
      const { email, password, name, nativeLanguageId } = request.body;

      if (!email || !password || !name) {
        return reply.code(400).send({
          error: 'Email, password, and name are required',
        });
      }

      const user = await AuthService.register(email, password, name, nativeLanguageId);
      const token = AuthService.generateToken(request.server, user);

      return reply.code(201).send({
        message: 'User registered successfully',
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      if (error.message === 'User with this email already exists' || 
          error.message === 'Native language not found') {
        return reply.code(400).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async login(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({
          error: 'Email and password are required',
        });
      }

      const user = await AuthService.login(email, password);
      const token = AuthService.generateToken(request.server, user);
      const userJson = user.toJSON();
      
      // Log to debug
      console.log('Login - Raw user data:', {
        id: user.id,
        learningLanguageIds: user.learningLanguageIds,
        learningLanguageIdsType: typeof user.learningLanguageIds,
        voiceAccentVersion: user.voiceAccentVersion,
        voiceAccentVersionType: typeof user.voiceAccentVersion
      });
      
      console.log('Login - User JSON:', {
        id: userJson.id,
        learningLanguageIds: userJson.learningLanguageIds,
        learningLanguageIdsType: typeof userJson.learningLanguageIds,
        voiceAccentVersion: userJson.voiceAccentVersion,
        voiceAccentVersionType: typeof userJson.voiceAccentVersion
      });

      return reply.send({
        message: 'Login successful',
        token,
        user: this.normalizePermissions(userJson),
      });
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        return reply.code(401).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getCurrentUser(request, reply) {
    try {
      const user = await AuthService.getCurrentUser(request.user.id);
      
      // Get values from both dataValues and get({ plain: true })
      const dataValues = user.dataValues || {};
      const rawValues = user.get({ plain: true });
      
      // Log to debug
      console.log('getCurrentUser - dataValues:', {
        id: dataValues.id,
        learningLanguageIds: dataValues.learningLanguageIds,
        learningLanguageIdsType: typeof dataValues.learningLanguageIds,
        voiceAccentVersion: dataValues.voiceAccentVersion,
        voiceAccentVersionType: typeof dataValues.voiceAccentVersion,
        allKeys: Object.keys(dataValues)
      });
      
      console.log('getCurrentUser - rawValues from get({ plain: true }):', {
        id: rawValues.id,
        learningLanguageIds: rawValues.learningLanguageIds,
        learningLanguageIdsType: typeof rawValues.learningLanguageIds,
        learningLanguageIdsIsArray: Array.isArray(rawValues.learningLanguageIds),
        voiceAccentVersion: rawValues.voiceAccentVersion,
        voiceAccentVersionType: typeof rawValues.voiceAccentVersion,
        allKeys: Object.keys(rawValues)
      });
      
      // Use dataValues as primary source, fallback to rawValues
      const learningLangIds = dataValues.learningLanguageIds !== undefined 
        ? dataValues.learningLanguageIds 
        : (rawValues.learningLanguageIds !== undefined ? rawValues.learningLanguageIds : []);
      
      const voiceAccent = dataValues.voiceAccentVersion !== undefined && dataValues.voiceAccentVersion !== null
        ? dataValues.voiceAccentVersion
        : (rawValues.voiceAccentVersion !== undefined && rawValues.voiceAccentVersion !== null
          ? rawValues.voiceAccentVersion
          : 1);
      
      // Build user object manually to ensure all fields are included
      const userJson = {
        id: dataValues.id || rawValues.id,
        email: dataValues.email || rawValues.email,
        googleId: dataValues.googleId || rawValues.googleId,
        name: dataValues.name || rawValues.name,
        role: dataValues.role || rawValues.role,
        permissions: dataValues.permissions || rawValues.permissions,
        nativeLanguageId: dataValues.nativeLanguageId || rawValues.nativeLanguageId,
        learningLanguageIds: Array.isArray(learningLangIds) ? learningLangIds : (learningLangIds ? [learningLangIds] : []),
        voiceAccentVersion: parseInt(voiceAccent) || 1,
        createdAt: dataValues.createdAt || rawValues.createdAt,
        updatedAt: dataValues.updatedAt || rawValues.updatedAt,
      };
      
      // Add nativeLanguage if it exists
      if (user.nativeLanguage) {
        userJson.nativeLanguage = user.nativeLanguage.toJSON ? user.nativeLanguage.toJSON() : user.nativeLanguage;
      } else if (rawValues.nativeLanguage) {
        userJson.nativeLanguage = rawValues.nativeLanguage;
      }
      
      console.log('getCurrentUser - Built user JSON:', {
        id: userJson.id,
        learningLanguageIds: userJson.learningLanguageIds,
        learningLanguageIdsType: typeof userJson.learningLanguageIds,
        learningLanguageIdsIsArray: Array.isArray(userJson.learningLanguageIds),
        voiceAccentVersion: userJson.voiceAccentVersion,
        voiceAccentVersionType: typeof userJson.voiceAccentVersion,
        nativeLanguage: userJson.nativeLanguage,
        allKeys: Object.keys(userJson)
      });
      
      // Log the actual response that will be sent
      const responseToSend = { user: this.normalizePermissions(userJson) };
      console.log('getCurrentUser - Response to send (stringified):', JSON.stringify(responseToSend, null, 2));
      
      return reply.send(responseToSend);
    } catch (error) {
      if (error.message === 'User not found') {
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

  async loginWithGoogle(request, reply) {
    try {
      const { idToken } = request.body;

      if (!idToken) {
        return reply.code(400).send({
          error: 'Google ID token is required',
        });
      }

      const user = await AuthService.loginWithGoogle(idToken);
      const token = AuthService.generateToken(request.server, user);

      return reply.send({
        message: 'Google login successful',
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      if (error.message.includes('Google authentication failed')) {
        return reply.code(401).send({
          error: error.message,
        });
      }
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new AuthController();

