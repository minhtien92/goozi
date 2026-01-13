import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export default function (sequelize) {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true, // Nullable for Google OAuth users
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'Google OAuth ID',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
      permissions: {
        // JSON: { topics: boolean, vocabularies: boolean, home: boolean, users: boolean }
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      nativeLanguageId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'languages',
          key: 'id',
        },
      },
      voiceAccentVersion: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Voice accent version preference (1-4)',
      },
      learningLanguageIds: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: 'Array of language IDs that user is learning',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          // Only hash password if provided (not for Google OAuth users)
          if (user.password && !user.googleId) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          // Only hash password if changed and provided
          if (user.changed('password') && user.password && !user.googleId) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function () {
    console.log('=== User.toJSON CALLED ===');
    // Get all values - use dataValues directly to ensure JSONB fields are included
    const dataValues = this.dataValues || {};
    const rawValues = this.get({ plain: true });
    
    // Log to debug
    console.log('User.toJSON - DataValues:', {
      id: dataValues.id,
      learningLanguageIds: dataValues.learningLanguageIds,
      learningLanguageIdsType: typeof dataValues.learningLanguageIds,
      learningLanguageIdsIsArray: Array.isArray(dataValues.learningLanguageIds),
      voiceAccentVersion: dataValues.voiceAccentVersion,
      voiceAccentVersionType: typeof dataValues.voiceAccentVersion,
      allKeys: Object.keys(dataValues)
    });
    
    console.log('User.toJSON - Raw values from get():', {
      id: rawValues.id,
      learningLanguageIds: rawValues.learningLanguageIds,
      learningLanguageIdsType: typeof rawValues.learningLanguageIds,
      voiceAccentVersion: rawValues.voiceAccentVersion,
      voiceAccentVersionType: typeof rawValues.voiceAccentVersion,
      allKeys: Object.keys(rawValues)
    });
    
    // Build values object - use rawValues as primary source since it has all data from get({ plain: true })
    const values = {
      id: rawValues.id || dataValues.id,
      email: rawValues.email || dataValues.email,
      googleId: rawValues.googleId || dataValues.googleId,
      name: rawValues.name || dataValues.name,
      role: rawValues.role || dataValues.role,
      permissions: rawValues.permissions || dataValues.permissions,
      nativeLanguageId: rawValues.nativeLanguageId || dataValues.nativeLanguageId,
      createdAt: rawValues.createdAt || dataValues.createdAt,
      updatedAt: rawValues.updatedAt || dataValues.updatedAt,
    };
    
    // Add nativeLanguage if it exists
    if (this.nativeLanguage) {
      values.nativeLanguage = this.nativeLanguage.toJSON ? this.nativeLanguage.toJSON() : this.nativeLanguage;
    }
    
    // Set learningLanguageIds - use rawValues directly as it has the data
    if (rawValues.learningLanguageIds !== undefined) {
      if (typeof rawValues.learningLanguageIds === 'string') {
        try {
          values.learningLanguageIds = JSON.parse(rawValues.learningLanguageIds);
          console.log('User.toJSON - Parsed learningLanguageIds from string:', values.learningLanguageIds);
        } catch (e) {
          console.warn('User.toJSON - Failed to parse learningLanguageIds:', e);
          values.learningLanguageIds = rawValues.learningLanguageIds;
        }
      } else if (Array.isArray(rawValues.learningLanguageIds)) {
        values.learningLanguageIds = rawValues.learningLanguageIds;
        console.log('User.toJSON - Keeping learningLanguageIds as array:', values.learningLanguageIds);
      } else {
        values.learningLanguageIds = rawValues.learningLanguageIds;
        console.log('User.toJSON - learningLanguageIds has unexpected type:', values.learningLanguageIds);
      }
    } else {
      // Set to empty array to ensure it's always included
      values.learningLanguageIds = [];
      console.log('User.toJSON - learningLanguageIds is undefined, setting to empty array');
    }
    
    // Set voiceAccentVersion - use rawValues directly as it has the data
    if (rawValues.voiceAccentVersion !== undefined && rawValues.voiceAccentVersion !== null) {
      values.voiceAccentVersion = parseInt(rawValues.voiceAccentVersion) || 1;
      console.log('User.toJSON - Parsed voiceAccentVersion:', values.voiceAccentVersion);
    } else {
      // Set to 1 (default) to ensure it's always included
      values.voiceAccentVersion = 1;
      console.log('User.toJSON - voiceAccentVersion is undefined/null, setting to default 1');
    }
    
    console.log('User.toJSON - Final values:', {
      id: values.id,
      learningLanguageIds: values.learningLanguageIds,
      learningLanguageIdsType: typeof values.learningLanguageIds,
      voiceAccentVersion: values.voiceAccentVersion,
      voiceAccentVersionType: typeof values.voiceAccentVersion,
      allKeys: Object.keys(values)
    });
    
    return values;
  };

  return User;
}

