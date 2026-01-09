import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import User from './User.js';
import Topic from './Topic.js';
import TopicTranslation from './TopicTranslation.js';
import Vocabulary from './Vocabulary.js';
import VocabularyTranslation from './VocabularyTranslation.js';
import Language from './Language.js';
import HomeSetting from './HomeSetting.js';
import Testimonial from './Testimonial.js';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'goozi_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

const db = {
  sequelize,
  Sequelize,
  User: User(sequelize),
  Topic: Topic(sequelize),
  TopicTranslation: TopicTranslation(sequelize),
  Vocabulary: Vocabulary(sequelize),
  VocabularyTranslation: VocabularyTranslation(sequelize),
  Language: Language(sequelize),
  HomeSetting: HomeSetting(sequelize),
  Testimonial: Testimonial(sequelize),
};

// Define associations
// Language associations
db.Language.hasMany(db.User, { foreignKey: 'nativeLanguageId', as: 'users' });
db.User.belongsTo(db.Language, { foreignKey: 'nativeLanguageId', as: 'nativeLanguage' });

// Topic-Vocabulary associations
db.Topic.hasMany(db.Vocabulary, { foreignKey: 'topicId', as: 'vocabularies' });
db.Vocabulary.belongsTo(db.Topic, { foreignKey: 'topicId', as: 'topic' });

// Topic-Translation associations
db.Topic.hasMany(db.TopicTranslation, { foreignKey: 'topicId', as: 'translations' });
db.TopicTranslation.belongsTo(db.Topic, { foreignKey: 'topicId', as: 'topic' });

// Vocabulary-Translation associations
db.Vocabulary.hasMany(db.VocabularyTranslation, { foreignKey: 'vocabularyId', as: 'translations' });
db.VocabularyTranslation.belongsTo(db.Vocabulary, { foreignKey: 'vocabularyId', as: 'vocabulary' });

// Language-Translation associations
db.Language.hasMany(db.TopicTranslation, { foreignKey: 'languageId', as: 'topicTranslations' });
db.TopicTranslation.belongsTo(db.Language, { foreignKey: 'languageId', as: 'language' });

db.Language.hasMany(db.VocabularyTranslation, { foreignKey: 'languageId', as: 'vocabularyTranslations' });
db.VocabularyTranslation.belongsTo(db.Language, { foreignKey: 'languageId', as: 'language' });

export default db;

