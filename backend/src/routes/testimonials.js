import TestimonialController from '../controllers/TestimonialController.js';

async function testimonialsRoutes(fastify, options) {
  // Get all testimonials (admin only)
  fastify.get('/', {
    preHandler: [fastify.requireAdmin],
  }, TestimonialController.getAllTestimonials.bind(TestimonialController));

  // Get active testimonials (public)
  fastify.get('/active', TestimonialController.getActiveTestimonials.bind(TestimonialController));

  // Get testimonial by id (admin only)
  fastify.get('/:id', {
    preHandler: [fastify.requireAdmin],
  }, TestimonialController.getTestimonialById.bind(TestimonialController));

  // Create testimonial (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdmin],
  }, TestimonialController.createTestimonial.bind(TestimonialController));

  // Update testimonial (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.requireAdmin],
  }, TestimonialController.updateTestimonial.bind(TestimonialController));

  // Delete testimonial (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdmin],
  }, TestimonialController.deleteTestimonial.bind(TestimonialController));
}

export default testimonialsRoutes;

