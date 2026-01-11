import TestimonialService from '../services/TestimonialService.js';

class TestimonialController {
  async getAllTestimonials(request, reply) {
    try {
      const { page, limit } = request.query;
      const result = await TestimonialService.getAllTestimonials({ page, limit });
      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getActiveTestimonials(request, reply) {
    try {
      const testimonials = await TestimonialService.getActiveTestimonials();
      return reply.send({ testimonials });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getTestimonialById(request, reply) {
    try {
      const { id } = request.params;
      const testimonial = await TestimonialService.getTestimonialById(id);
      return reply.send({ testimonial });
    } catch (error) {
      if (error.message === 'Testimonial not found') {
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

  async createTestimonial(request, reply) {
    try {
      const testimonial = await TestimonialService.createTestimonial(request.body);
      return reply.code(201).send({
        message: 'Testimonial created successfully',
        testimonial,
      });
    } catch (error) {
      return reply.code(500).send({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async updateTestimonial(request, reply) {
    try {
      const { id } = request.params;
      const testimonial = await TestimonialService.updateTestimonial(id, request.body);
      return reply.send({
        message: 'Testimonial updated successfully',
        testimonial,
      });
    } catch (error) {
      if (error.message === 'Testimonial not found') {
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

  async deleteTestimonial(request, reply) {
    try {
      const { id } = request.params;
      await TestimonialService.deleteTestimonial(id);
      return reply.send({
        message: 'Testimonial deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Testimonial not found') {
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

export default new TestimonialController();

