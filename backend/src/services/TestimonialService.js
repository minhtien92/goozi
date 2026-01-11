import db from '../models/index.js';

class TestimonialService {
  async getAllTestimonials(filters = {}) {
    const { page, limit } = filters;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await db.Testimonial.findAndCountAll({
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
      limit: limitNum,
      offset: offset,
    });

    // Ensure count is a number
    const totalCount = parseInt(count) || 0;

    return {
      testimonials: rows.map((t) => t.toJSON()),
      pagination: {
        totalItems: totalCount,
        totalPages: totalCount > 0 ? Math.ceil(totalCount / limitNum) : 1,
        currentPage: pageNum,
        itemsPerPage: limitNum,
      },
    };
  }

  async getActiveTestimonials() {
    const testimonials = await db.Testimonial.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    return testimonials.map((t) => t.toJSON());
  }

  async getTestimonialById(id) {
    const testimonial = await db.Testimonial.findByPk(id);
    if (!testimonial) {
      throw new Error('Testimonial not found');
    }
    return testimonial.toJSON();
  }

  async createTestimonial(data) {
    const { name, quote, order, isActive } = data;

    const testimonial = await db.Testimonial.create({
      name,
      quote,
      order: order !== null && order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return testimonial.toJSON();
  }

  async updateTestimonial(id, data) {
    const testimonial = await db.Testimonial.findByPk(id);
    if (!testimonial) {
      throw new Error('Testimonial not found');
    }

    const { name, quote, order, isActive } = data;

    await testimonial.update({
      name: name !== undefined ? name : testimonial.name,
      quote: quote !== undefined ? quote : testimonial.quote,
      order: order !== undefined ? order : testimonial.order,
      isActive: isActive !== undefined ? isActive : testimonial.isActive,
    });

    return testimonial.toJSON();
  }

  async deleteTestimonial(id) {
    const testimonial = await db.Testimonial.findByPk(id);
    if (!testimonial) {
      throw new Error('Testimonial not found');
    }

    await testimonial.destroy();
    return true;
  }
}

export default new TestimonialService();

