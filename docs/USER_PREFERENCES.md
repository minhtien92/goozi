# User Preferences & Settings - Goozi

## Tổng Quan

Hệ thống Goozi cho phép user lưu các preferences về ngôn ngữ và giọng nói, được đồng bộ giữa frontend và backend, và persist qua các session.

## Cấu Trúc Dữ Liệu

### User Preferences Fields

User model có 3 fields chính để lưu preferences:

#### 1. `nativeLanguageId` (UUID)
- **Type**: UUID (Foreign Key → Language)
- **Description**: Ngôn ngữ mẹ đẻ của user
- **Nullable**: Yes
- **Default**: null
- **Relationship**: `belongsTo Language (as: 'nativeLanguage')`

#### 2. `learningLanguageIds` (JSONB)
- **Type**: JSONB (Array of UUIDs)
- **Description**: Danh sách các ngôn ngữ mà user đang học
- **Nullable**: Yes
- **Default**: null
- **Format**: `["uuid1", "uuid2", ...]`
- **Example**: `["764c6db8-5c2c-4629-8155-2938d1d34cd2", "a1b2c3d4-..."`

#### 3. `voiceAccentVersion` (INTEGER)
- **Type**: INTEGER
- **Description**: Phiên bản giọng nói ưa thích (1-4)
- **Nullable**: Yes
- **Default**: 1
- **Range**: 1-4
- **Usage**: Dùng cho Text-to-Speech (TTS) để chọn giọng nói phù hợp

## Database Schema

```sql
-- User table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  "nativeLanguageId" UUID REFERENCES languages(id),
  "voiceAccentVersion" INTEGER DEFAULT 1,
  "learningLanguageIds" JSONB,
  permissions JSONB,
  ...
);
```

## Data Flow

### 1. User Chọn Preferences (Frontend)

**Component**: `web/src/components/UserMenu.tsx`

**Flow**:
1. User mở UserMenu dropdown
2. Chọn "Mother Tongue" → gọi `handleUpdateNativeLanguage()`
3. Chọn "Learning Languages" → gọi `handleLanguageToggle()`
4. Chọn "Voice Accent" → gọi `handleVoiceAccentChange()`

**Code Example**:
```typescript
const handleUpdateNativeLanguage = async (languageId: string) => {
  try {
    await api.put(`/users/${user.id}`, {
      nativeLanguageId: languageId
    });
    
    // Fetch fresh user data to get nativeLanguage object
    const response = await api.get('/auth/me');
    setAuth(response.data.user, token);
  } catch (error) {
    console.error('Error updating native language:', error);
  }
};
```

### 2. API Update (Backend)

**Endpoint**: `PUT /api/users/:id`

**Controller**: `backend/src/controllers/UserController.js`
**Service**: `backend/src/services/UserService.js`

**Flow**:
1. Validate request (self-update hoặc admin update)
2. Update user trong database
3. Include `nativeLanguage` trong response nếu có
4. Trả về user object đã cập nhật

**Code Example**:
```javascript
// UserService.js
async updateUser(userId, data, currentUser) {
  const user = await db.User.findByPk(userId, {
    include: [{ model: db.Language, as: 'nativeLanguage' }]
  });
  
  // Update fields
  if (data.nativeLanguageId !== undefined) {
    user.nativeLanguageId = data.nativeLanguageId;
  }
  if (data.learningLanguageIds !== undefined) {
    user.learningLanguageIds = data.learningLanguageIds; // JSONB array
  }
  if (data.voiceAccentVersion !== undefined) {
    user.voiceAccentVersion = data.voiceAccentVersion;
  }
  
  await user.save();
  await user.reload({ include: [{ model: db.Language, as: 'nativeLanguage' }] });
  
  return user;
}
```

### 3. State Synchronization (Frontend)

**Store**: `web/src/store/authStore.ts`

**Flow**:
1. Sau khi update thành công, gọi `api.get('/auth/me')` để fetch fresh data
2. Update Zustand store với `setAuth(user, token)`
3. Zustand persist middleware lưu vào localStorage
4. Custom serialize/deserialize đảm bảo JSONB fields được xử lý đúng

**Code Example**:
```typescript
// authStore.ts
const serialize = (state: AuthState) => {
  const serialized = {
    ...state,
    user: state.user ? {
      ...state.user,
      learningLanguageIds: Array.isArray(state.user.learningLanguageIds) 
        ? state.user.learningLanguageIds 
        : [],
      voiceAccentVersion: typeof state.user.voiceAccentVersion === 'number'
        ? state.user.voiceAccentVersion
        : 1
    } : null
  };
  return JSON.stringify(serialized);
};
```

### 4. Persistence Across Sessions

**Mechanism**: Zustand persist middleware với localStorage

**Flow**:
1. User preferences được lưu trong Zustand store
2. Zustand persist middleware tự động serialize và lưu vào localStorage
3. Khi app khởi động, Zustand tự động deserialize từ localStorage
4. Nếu user đã đăng nhập, gọi `/auth/me` để sync với server

**Code Example**:
```typescript
// authStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'auth-storage',
      serialize,
      deserialize
    }
  )
);
```

## API Endpoints

### GET `/api/auth/me`

**Description**: Lấy thông tin user hiện tại, bao gồm preferences

**Response Schema** (Fastify):
```javascript
{
  user: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['user', 'admin'] },
    nativeLanguageId: { type: 'string', format: 'uuid' },
    learningLanguageIds: { 
      type: 'array', 
      items: { type: 'string', format: 'uuid' } 
    },
    voiceAccentVersion: { type: 'integer' },
    nativeLanguage: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        code: { type: 'string' },
        name: { type: 'string' },
        nativeName: { type: 'string' },
        flag: { type: 'string' }
      }
    }
  }
}
```

**⚠️ QUAN TRỌNG**: Các fields `learningLanguageIds` và `voiceAccentVersion` **PHẢI** được khai báo trong response schema, nếu không Fastify sẽ filter chúng ra khỏi response.

### PUT `/api/users/:id`

**Description**: Cập nhật user, bao gồm preferences

**Request Body**:
```json
{
  "nativeLanguageId": "764c6db8-5c2c-4629-8155-2938d1d34cd2",
  "learningLanguageIds": ["uuid1", "uuid2"],
  "voiceAccentVersion": 2
}
```

**Response**: User object đã cập nhật

## Model Implementation

### User Model (`backend/src/models/User.js`)

**toJSON() Method**: Xử lý JSONB fields để đảm bảo format đúng

```javascript
User.prototype.toJSON = function () {
  const rawValues = this.get({ plain: true });
  const values = { ...rawValues };
  
  // Parse learningLanguageIds if it's a string
  if (rawValues.learningLanguageIds !== undefined) {
    if (typeof rawValues.learningLanguageIds === 'string') {
      try {
        values.learningLanguageIds = JSON.parse(rawValues.learningLanguageIds);
      } catch (e) {
        values.learningLanguageIds = rawValues.learningLanguageIds;
      }
    } else if (Array.isArray(rawValues.learningLanguageIds)) {
      values.learningLanguageIds = rawValues.learningLanguageIds;
    } else {
      values.learningLanguageIds = [];
    }
  } else {
    values.learningLanguageIds = [];
  }
  
  // Ensure voiceAccentVersion is an integer
  if (rawValues.voiceAccentVersion !== undefined && rawValues.voiceAccentVersion !== null) {
    values.voiceAccentVersion = parseInt(rawValues.voiceAccentVersion) || 1;
  } else {
    values.voiceAccentVersion = 1;
  }
  
  // Include nativeLanguage if it exists
  if (this.nativeLanguage) {
    values.nativeLanguage = this.nativeLanguage.toJSON ? 
      this.nativeLanguage.toJSON() : 
      this.nativeLanguage;
  }
  
  return values;
};
```

## Frontend Usage

### Reading Preferences

```typescript
import { useAuthStore } from '../store/authStore';

function MyComponent() {
  const { user } = useAuthStore();
  
  // Get native language
  const nativeLanguage = user?.nativeLanguage;
  const nativeLanguageCode = user?.nativeLanguage?.code; // 'en', 'ja', 'vi', etc.
  
  // Get learning languages
  const learningLanguageIds = user?.learningLanguageIds || [];
  
  // Get voice accent
  const voiceAccentVersion = user?.voiceAccentVersion || 1;
}
```

### Updating Preferences

```typescript
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

function MyComponent() {
  const { user, setAuth } = useAuthStore();
  const token = useAuthStore(state => state.token);
  
  const updatePreferences = async () => {
    try {
      // Update on server
      await api.put(`/users/${user.id}`, {
        nativeLanguageId: 'new-language-id',
        learningLanguageIds: ['lang1', 'lang2'],
        voiceAccentVersion: 2
      });
      
      // Fetch fresh data
      const response = await api.get('/auth/me');
      setAuth(response.data.user, token);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };
}
```

## Common Issues & Solutions

### Issue 1: Preferences không đồng bộ sau khi update

**Nguyên nhân**: Không fetch fresh data sau khi update

**Giải pháp**: Luôn gọi `api.get('/auth/me')` sau khi update thành công

### Issue 2: `learningLanguageIds` là `undefined` trong response

**Nguyên nhân**: Fastify schema validation filter field không được khai báo

**Giải pháp**: Đảm bảo field được khai báo trong response schema của route

### Issue 3: Preferences bị mất sau khi reload

**Nguyên nhân**: Zustand persist middleware không serialize đúng

**Giải pháp**: Kiểm tra custom serialize/deserialize functions trong authStore

### Issue 4: `voiceAccentVersion` không phải number

**Nguyên nhân**: JSONB có thể trả về string

**Giải pháp**: Parse trong model's `toJSON()` method: `parseInt(value) || 1`

## Best Practices

1. **Luôn fetch fresh data sau update**: Gọi `/auth/me` sau khi update preferences
2. **Validate data types**: Đảm bảo `learningLanguageIds` là array và `voiceAccentVersion` là number
3. **Handle null/undefined**: Luôn có default values
4. **Sync với server**: Nếu user đã đăng nhập nhưng preferences missing, fetch từ server
5. **Fastify schema**: Luôn khai báo JSONB fields trong response schema

## Related Documentation

- [BACKEND.md](./BACKEND.md) - Backend architecture
- [API.md](./API.md) - API endpoints
- [WEB.md](./WEB.md) - Web application
