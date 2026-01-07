import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Testimonial = sequelize.define(
    'Testimonial',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the person giving testimonial',
      },
      quote: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Testimonial quote/text',
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Order for display',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'testimonials',
      timestamps: true,
    }
  );

  return Testimonial;
}

