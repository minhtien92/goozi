import { useEffect, useState } from 'react';
import api from '../config/api';

interface HomeSetting {
  id: string;
  key: string;
  value: string;
  order: number;
  isActive: boolean;
}

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isActive: boolean;
}

export default function Slogan() {
  const [slogans, setSlogans] = useState<HomeSetting[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSloganId, setEditingSloganId] = useState<string | null>(null);
  
  // Form thêm mới / edit
  // sloganValues: key = languageId, value = text cho từng ngôn ngữ
  const [sloganValues, setSloganValues] = useState<Record<string, string>>({});
  // wordValue: tiện nhập nhanh slogan chính (thường là English)
  const [wordValue, setWordValue] = useState('');

  useEffect(() => {
    fetchLanguages();
    fetchSettings();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/languages?isActive=true');
      const activeLanguages = response.data.languages || response.data || [];
      setLanguages(activeLanguages.sort((a: Language, b: Language) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/home-settings');
      const allSettings = response.data.settings;
      
      // Get slogans
      const sloganSettings = allSettings.filter((s: HomeSetting) => s.key === 'slogan');
      sloganSettings.sort((a: HomeSetting, b: HomeSetting) => a.order - b.order);
      setSlogans(sloganSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseSloganTranslations = (value: string): Record<string, string> => {
    // value có thể là plain text (cũ) hoặc JSON map { [langCode]: text }
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      // ignore, treat as plain text
    }
    // Mặc định coi là English
    return { en: value };
  };

  const buildTranslationsPayload = (): Record<string, string> => {
    const translations: Record<string, string> = {};

    // Ưu tiên giá trị nhập theo từng ngôn ngữ
    languages.forEach((lang) => {
      const val = (sloganValues[lang.id] || '').trim();
      if (val) {
        translations[lang.code] = val;
      }
    });

    const mainValue = wordValue.trim();
    if (mainValue) {
      const enLang = languages.find((l) => l.code === 'en');
      if (enLang && !translations['en']) {
        translations['en'] = mainValue;
      }
      if (Object.keys(translations).length === 0 && languages[0]) {
        translations[languages[0].code] = mainValue;
      }
    }

    return translations;
  };

  const handleEdit = (sloganId: string) => {
    const slogan = slogans.find((s) => s.id === sloganId);
    if (slogan) {
      setEditingSloganId(sloganId);

      const translations = parseSloganTranslations(slogan.value);
      // Thiết lập wordValue theo English (nếu có) hoặc bản dịch đầu tiên
      setWordValue(translations['en'] || Object.values(translations)[0] || slogan.value);

      const initialValues: Record<string, string> = {};
      languages.forEach((lang) => {
        initialValues[lang.id] = translations[lang.code] || '';
      });
      setSloganValues(initialValues);
    }
  };

  const handleCancelEdit = () => {
    setEditingSloganId(null);
    setSloganValues({});
    setWordValue('');
  };

  const handleDeleteSlogan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slogan?')) return;

    try {
      await api.delete(`/home-settings/${id}`);
      alert('Slogan deleted successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error deleting slogan:', error);
      alert('Failed to delete slogan');
    }
  };

  const handleSloganValueChange = (languageId: string, value: string) => {
    setSloganValues(prev => ({
      ...prev,
      [languageId]: value
    }));
  };

  const handleSaveSlogan = async () => {
    const translations = buildTranslationsPayload();

    if (!Object.keys(translations).length) {
      alert(`Please enter slogan in at least one language`);
      return;
    }

    const value = JSON.stringify(translations);

    try {
      if (editingSloganId) {
        // Update existing slogan
        const slogan = slogans.find((s) => s.id === editingSloganId);
        if (!slogan) return;

        await api.put(`/home-settings/${slogan.id}`, {
          key: slogan.key,
          value,
          order: slogan.order,
          isActive: true,
        });
        alert('Slogan updated successfully!');
      } else {
        // Create new slogan
        let maxOrder = 0;
        if (slogans.length > 0) {
          const orders = slogans.map((s) => s.order || 0);
          maxOrder = Math.max(...orders) + 1;
        }

        await api.post('/home-settings/create', {
          key: 'slogan',
          value,
          order: maxOrder,
          isActive: true,
        });
        alert('Slogan added successfully!');
      }

      // Reset form
      setEditingSloganId(null);
      setSloganValues({});
      setWordValue('');
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving slogan:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Lỗi không xác định';
      alert('Failed to save slogan: ' + errorMessage);
    }
  };

  const getDisplaySlogan = (slogan: HomeSetting) => {
    // Hiển thị English nếu có, nếu không thì lấy bản dịch đầu tiên hoặc value gốc
    try {
      const parsed = JSON.parse(slogan.value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const map = parsed as Record<string, string>;
        return map['en'] || Object.values(map)[0] || slogan.value;
      }
    } catch {
      // ignore
    }
    return slogan.value;
  };

  const filteredSlogans = slogans.filter((slogan) =>
    getDisplaySlogan(slogan).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 200px)', gap: '10px' }}>
      {/* Left Panel - Slogan List */}
      <div className="flex-fill" style={{ overflowY: 'auto' }}>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                style={{ width: '200px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th>English</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlogans.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted">
                        No slogans found
                      </td>
                    </tr>
                  ) : (
                    filteredSlogans.map((slogan, index) => (
                      <tr key={slogan.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span>{getDisplaySlogan(slogan)}</span>
                        </td>
                        <td>
                          <div className="d-flex" style={{ gap: '5px' }}>
                            <button
                              onClick={() => handleEdit(slogan.id)}
                              className="btn btn-sm btn-primary"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteSlogan(slogan.id)}
                              className="btn btn-sm btn-danger"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Add/Edit Slogan Form */}
      <div className="card" style={{ width: '400px' }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">
            <i className={editingSloganId ? "fas fa-edit mr-2" : "fas fa-plus mr-2"}></i>
            {editingSloganId ? 'Edit Slogan' : 'Add a new slogan'}
          </h4>
          <div className="d-flex" style={{ gap: '5px' }}>
            {editingSloganId && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCancelEdit}
              >
                <i className="fas fa-times mr-1"></i>
                Cancel
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveSlogan}
            >
              <i className={editingSloganId ? "fas fa-save mr-1" : "fas fa-save mr-1"}></i>
              {editingSloganId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
        <div className="card-body" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
          <div className="form-group">
            <label>Word</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter word"
              value={wordValue}
              onChange={(e) => setWordValue(e.target.value)}
            />
          </div>
          
          {/* Language inputs - mapped to actual languages */}
          {languages.length === 0 ? (
            <div className="text-muted text-center py-3">
              <div className="spinner-border spinner-border-sm mr-2" role="status"></div>
              Loading languages...
            </div>
          ) : (
            languages.map((lang) => (
              <div key={lang.id} className="form-group">
                <label>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Enter slogan in ${lang.nativeName}`}
                  value={sloganValues[lang.id] || ''}
                  onChange={(e) => handleSloganValueChange(lang.id, e.target.value)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
