import AuthService from '../services/AuthService.js';

class AuthController {
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

      return reply.send({
        message: 'Login successful',
        token,
        user: user.toJSON(),
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
      return reply.send({ user: user.toJSON() });
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

