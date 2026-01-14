# Multi-Language Support - Goozi

## Tổng Quan

Hệ thống Goozi hỗ trợ đa ngôn ngữ cho các nội dung như slogans, testimonials, topics, và vocabularies. Nội dung được lưu trữ theo từng ngôn ngữ và hiển thị dựa trên ngôn ngữ mẹ đẻ của user.

## Cấu Trúc Dữ Liệu

### 1. Slogans (Home Settings)

**Table**: `home_settings`
**Key**: `slogan`
**Value Format**: JSON string chứa translations

**Structure**:
```json
{
  "en": "Welcome to Goozi",
  "ja": "Gooziへようこそ",
  "vi": "Chào mừng đến với Goozi",
  "ko": "Goozi에 오신 것을 환영합니다"
}
```

**Database**:
```sql
-- home_settings table
CREATE TABLE home_settings (
  id UUID PRIMARY KEY,
  key VARCHAR(255) NOT NULL,  -- 'slogan', 'picture', etc.
  value JSONB,                -- JSON string: {"en": "...", "ja": "..."}
  order INTEGER,
  is_active BOOLEAN DEFAULT true,
  language_id UUID REFERENCES languages(id)  -- Optional, not used for slogans
);
```

**Example Record**:
```json
{
  "id": "uuid-here",
  "key": "slogan",
  "value": "{\"en\": \"Welcome to Goozi\", \"ja\": \"Gooziへようこそ\", \"vi\": \"Chào mừng đến với Goozi\"}",
  "order": 1,
  "isActive": true
}
```

### 2. Topics

**Tables**: 
- `topics` - Chủ đề chính
- `topic_translations` - Bản dịch theo ngôn ngữ

**Structure**:
```sql
-- topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY,
  order INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- topic_translations table
CREATE TABLE topic_translations (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES topics(id),
  language_id UUID REFERENCES languages(id),
  name VARCHAR(255),
  description TEXT
);
```

**Example**:
```json
{
  "id": "topic-uuid",
  "order": 1,
  "translations": [
    {
      "languageId": "en-lang-uuid",
      "name": "Food & Drinks",
      "description": "Learn vocabulary about food and drinks"
    },
    {
      "languageId": "ja-lang-uuid",
      "name": "食べ物と飲み物",
      "description": "食べ物と飲み物に関する語彙を学ぶ"
    }
  ]
}
```

### 3. Vocabularies

**Tables**:
- `vocabularies` - Từ vựng chính
- `vocabulary_translations` - Bản dịch theo ngôn ngữ

**Structure**:
```sql
-- vocabularies table
CREATE TABLE vocabularies (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES topics(id),
  word VARCHAR(255) NOT NULL,
  meaning VARCHAR(255),  -- Original meaning (nullable)
  avatar VARCHAR(255),   -- Image URL
  order INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- vocabulary_translations table
CREATE TABLE vocabulary_translations (
  id UUID PRIMARY KEY,
  vocabulary_id UUID REFERENCES vocabularies(id),
  language_id UUID REFERENCES languages(id),
  translation VARCHAR(255),
  phonetic VARCHAR(255)
);
```

**Example**:
```json
{
  "id": "vocab-uuid",
  "word": "Hello",
  "meaning": "Xin chào",
  "avatar": "/uploads/hello.jpg",
  "translations": [
    {
      "languageId": "ja-lang-uuid",
      "translation": "こんにちは",
      "phonetic": "konnichiwa"
    },
    {
      "languageId": "vi-lang-uuid",
      "translation": "Xin chào",
      "phonetic": ""
    }
  ]
}
```

### 4. Testimonials

**Table**: `testimonials`

**Structure**:
```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  content TEXT,
  avatar VARCHAR(255),
  language_id UUID REFERENCES languages(id),  -- Language of the testimonial
  order INTEGER,
  is_active BOOLEAN DEFAULT true
);
```

**Note**: Testimonials hiện tại lưu theo từng ngôn ngữ riêng biệt (mỗi testimonial có một `language_id`), không phải JSON như slogans.

## Data Flow

### 1. Slogans - CMS to Frontend

#### CMS: Admin nhập slogan

**Component**: `cms/src/pages/Slogan.tsx`

**Flow**:
1. Admin mở trang Slogan management
2. Form hiển thị input cho mỗi active language
3. Admin nhập slogan cho từng ngôn ngữ
4. Khi save, convert thành JSON string:

```typescript
const buildTranslationsPayload = (): Record<string, string> => {
  const translations: Record<string, string> = {};
  
  languages.forEach((lang) => {
    const val = (sloganValues[lang.id] || '').trim();
    if (val) {
      translations[lang.code] = val;  // lang.code = 'en', 'ja', 'vi', etc.
    }
  });
  
  return translations;
};

// Save
const value = JSON.stringify(translations);
await api.post('/home-settings', {
  key: 'slogan',
  value: value,  // JSON string
  order: 1,
  isActive: true
});
```

#### Backend: Lưu slogan

**Service**: `backend/src/services/HomeSettingService.js`

```javascript
async createSetting(data) {
  const setting = await db.HomeSetting.create({
    key: data.key,
    value: data.value,  // JSON string
    order: data.order,
    isActive: data.isActive
  });
  return setting;
}
```

#### Frontend: Hiển thị slogan

**Component**: `web/src/pages/Home.tsx`

**Flow**:
1. Fetch home settings với key = 'slogan'
2. Parse JSON string từ `value`
3. Chọn translation theo `user.nativeLanguage.code`
4. Hiển thị slogan

```typescript
const fetchHomeSettings = async () => {
  try {
    const response = await api.get('/home-settings/active');
    const settings = response.data.settings || [];
    
    // Get slogan
    const sloganSetting = settings.find(s => s.key === 'slogan');
    if (sloganSetting) {
      // Parse JSON string
      let sloganTranslations: Record<string, string> = {};
      try {
        sloganTranslations = JSON.parse(sloganSetting.value);
      } catch (e) {
        // Legacy: if value is plain string, treat as English
        sloganTranslations = { en: sloganSetting.value };
      }
      
      // Get user's native language code
      const nativeLangCode = user?.nativeLanguage?.code || 'en';
      
      // Get slogan for user's language, fallback to English
      const slogan = sloganTranslations[nativeLangCode] || sloganTranslations['en'] || '';
      
      setSlogans([slogan]);
    }
  } catch (error) {
    console.error('Error fetching home settings:', error);
  }
};
```

### 2. Topics - Multi-Language Display

#### Backend: Fetch topics với translations

**Endpoint**: `GET /api/topics?language=ja`

**Service**: `backend/src/services/TopicService.js`

```javascript
async getAllTopics(query = {}) {
  const { language } = query;
  
  const topics = await db.Topic.findAll({
    include: [
      {
        model: db.TopicTranslation,
        as: 'translations',
        include: [
          {
            model: db.Language,
            as: 'language'
          }
        ]
      }
    ],
    order: [['order', 'ASC']]
  });
  
  // Filter translations by language if specified
  if (language) {
    topics.forEach(topic => {
      topic.translations = topic.translations.filter(
        t => t.language.code === language
      );
    });
  }
  
  return topics;
}
```

#### Frontend: Hiển thị topics

**Component**: `web/src/pages/Topics.tsx`

```typescript
const fetchTopics = async () => {
  try {
    const languageCode = user?.nativeLanguage?.code || 'en';
    const response = await api.get(`/topics?language=${languageCode}`);
    setTopics(response.data.topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
  }
};

// Display
{topics.map(topic => {
  const translation = topic.translations?.[0]; // First translation for selected language
  return (
    <div key={topic.id}>
      <h3>{translation?.name || 'No translation'}</h3>
      <p>{translation?.description || ''}</p>
    </div>
  );
})}
```

### 3. Vocabularies - Multi-Language Display

Tương tự như topics, vocabularies sử dụng `vocabulary_translations` table để lưu translations cho mỗi ngôn ngữ.

## Language Selection

### User's Native Language

User chọn "Mother Tongue" trong UserMenu, được lưu trong `user.nativeLanguageId`.

**Flow**:
1. User chọn native language
2. Update `user.nativeLanguageId` via `PUT /users/:id`
3. Frontend fetch fresh user data
4. Tất cả nội dung tự động hiển thị theo `user.nativeLanguage.code`

### Language Code Mapping

**Language codes** (ISO 639-1):
- `en` - English
- `ja` - Japanese (日本語)
- `vi` - Vietnamese (Tiếng Việt)
- `ko` - Korean (한국어)
- `zh` - Chinese (中文)
- etc.

**Usage**: Language code được dùng làm key trong JSON translations:
```json
{
  "en": "Welcome",
  "ja": "ようこそ",
  "vi": "Chào mừng"
}
```

## CMS Implementation

### Slogan Management

**File**: `cms/src/pages/Slogan.tsx`

**Features**:
- Hiển thị form với input cho mỗi active language
- Parse JSON khi edit: `parseSloganTranslations(value)`
- Build JSON khi save: `buildTranslationsPayload()`
- Validate: Đảm bảo có ít nhất một translation

**Code Example**:
```typescript
// Parse existing slogan
const parseSloganTranslations = (value: string): Record<string, string> => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Legacy: treat as plain text (English)
    return { en: value };
  }
  return { en: value };
};

// Build payload for save
const buildTranslationsPayload = (): Record<string, string> => {
  const translations: Record<string, string> = {};
  
  languages.forEach((lang) => {
    const val = (sloganValues[lang.id] || '').trim();
    if (val) {
      translations[lang.code] = val;
    }
  });
  
  return translations;
};

// Save
const handleSave = async () => {
  const translations = buildTranslationsPayload();
  const value = JSON.stringify(translations);
  
  await api.post('/home-settings', {
    key: 'slogan',
    value: value,
    order: 1,
    isActive: true
  });
};
```

## Frontend Implementation

### Home Page - Slogan Display

**File**: `web/src/pages/Home.tsx`

**Flow**:
1. Fetch home settings khi component mount hoặc khi `user.nativeLanguage.code` thay đổi
2. Parse JSON từ `value`
3. Chọn translation theo `user.nativeLanguage.code`
4. Fallback to English nếu không có translation

```typescript
useEffect(() => {
  fetchHomeSettings();
}, [user?.nativeLanguage?.code]);

const fetchHomeSettings = async () => {
  const response = await api.get('/home-settings/active');
  const sloganSetting = response.data.settings.find(s => s.key === 'slogan');
  
  if (sloganSetting) {
    let translations: Record<string, string> = {};
    try {
      translations = JSON.parse(sloganSetting.value);
    } catch {
      translations = { en: sloganSetting.value }; // Legacy
    }
    
    const langCode = user?.nativeLanguage?.code || 'en';
    const slogan = translations[langCode] || translations['en'] || '';
    setSlogans([slogan]);
  }
};
```

### Topics & Vocabularies Display

Tương tự, frontend fetch topics/vocabularies với `?language=ja` và hiển thị translations tương ứng.

## Best Practices

1. **Always provide fallback**: Nếu không có translation cho ngôn ngữ của user, fallback to English
2. **Validate JSON format**: Khi parse JSON, luôn có try-catch để handle invalid JSON
3. **Legacy data support**: Hỗ trợ data cũ (plain string) bằng cách treat as English
4. **Language code consistency**: Sử dụng ISO 639-1 codes (`en`, `ja`, `vi`, etc.)
5. **CMS validation**: Đảm bảo admin nhập ít nhất một translation khi tạo slogan

## Future Enhancements

1. **Testimonials multi-language**: Có thể chuyển testimonials sang format JSON như slogans
2. **Auto-translation**: Tích hợp API dịch tự động (nhưng user đã yêu cầu không dùng)
3. **Language fallback chain**: Nếu không có translation cho ngôn ngữ A, thử ngôn ngữ B, rồi English
4. **Translation management**: CMS có thể quản lý translations tốt hơn với preview

## Related Documentation

- [USER_PREFERENCES.md](./USER_PREFERENCES.md) - User preferences và native language
- [BACKEND.md](./BACKEND.md) - Backend models và services
- [CMS.md](./CMS.md) - CMS implementation
- [WEB.md](./WEB.md) - Web application implementation
