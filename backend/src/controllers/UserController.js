import UserService from '../services/UserService.js';

class UserController {
  async getAllUsers(request, reply) {
    try {
      const users = await UserService.getAllUsers();
      return reply.send({ users });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getUserById(request, reply) {
    try {
      const { id } = request.params;
      const user = await UserService.getUserById(id);

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

  async updateUser(request, reply) {
    try {
      const { id } = request.params;
      const currentUser = request.user;
      const isSelfUpdate = currentUser.id === id;
      
      // Check permissions: user can only update themselves, admin can update anyone
      if (!isSelfUpdate && currentUser.role !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden: You can only update your own profile',
        });
      }
      
      const user = await UserService.updateUser(id, request.body, isSelfUpdate);

      return reply.send({
        message: 'User updated successfully',
        user: user.toJSON(),
      });
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

  async deleteUser(request, reply) {
    try {
      const { id } = request.params;
      await UserService.deleteUser(id);

      return reply.send({
        message: 'User deleted successfully',
      });
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
}

export default new UserController();

