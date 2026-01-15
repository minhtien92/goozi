import { useEffect, useState } from 'react';
import api, { uploadFile } from '../config/api';

const DEFAULT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"80\"%3E%3Crect width=\"120\" height=\"80\" fill=\"%23f0f0f0\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23999\" font-size=\"12\"%3ENo Image%3C/text%3E%3C/svg%3E';

interface HomeSetting {
  id: string;
  key: string;
  value: string;
  order: number;
  isActive: boolean;
}

export default function HomeSettings() {
  const [slogans, setSlogans] = useState<HomeSetting[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sloganValues, setSloganValues] = useState<string[]>(['', '', '', '', '']);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/home-settings');
      const allSettings = response.data.settings;
      
      // Get slogans
      const sloganSettings = allSettings.filter((s: HomeSetting) => s.key === 'slogan');
      sloganSettings.sort((a: HomeSetting, b: HomeSetting) => a.order - b.order);
      setSlogans(sloganSettings);
      
      // Initialize slogan values
      const values = ['', '', '', '', ''];
      sloganSettings.forEach((slogan: HomeSetting, index: number) => {
        if (index < 5) {
          values[index] = slogan.value;
        }
      });
      setSloganValues(values);

      // Get background image
      const bgSetting = allSettings.find((s: HomeSetting) => s.key === 'background_image');
      if (bgSetting && bgSetting.value) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        setBackgroundImage(bgSetting.value.startsWith('http') ? bgSetting.value : `${baseUrl}${bgSetting.value}`);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSloganChange = (index: number, value: string) => {
    const newValues = [...sloganValues];
    newValues[index] = value;
    setSloganValues(newValues);
  };

  const handleSaveSlogans = async () => {
    try {
      const slogansToSave = sloganValues
        .map((value, index) => ({
          value: value.trim(),
          order: index,
          isActive: value.trim() !== '',
        }))
        .filter((s) => s.value !== '');

      await api.post('/home-settings/slogans/bulk', { slogans: slogansToSave });
      alert('Slogan saved successfully!');
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving slogans:', error);
      alert('Failed to save slogan: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBackgroundImageUpload = async (file: File) => {
    try {
      const response = await uploadFile('/upload/image', file);
      
      if (response.data.url) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        const fullUrl = `${baseUrl}${response.data.url}`;
        
        await api.post('/home-settings', {
          key: 'background_image',
          value: response.data.url,
          isActive: true,
        });
        
        setBackgroundImage(fullUrl);
        alert('Background image uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Error uploading background image:', error);
      alert('Failed to upload background image: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteSlogan = async (id: string, index: number) => {
    if (!confirm('Are you sure you want to delete this slogan?')) return;

    try {
      await api.delete(`/home-settings/${id}`);
      const newValues = [...sloganValues];
      newValues[index] = '';
      setSloganValues(newValues);
      fetchSettings();
    } catch (error) {
      console.error('Error deleting slogan:', error);
      alert('Failed to delete slogan');
    }
  };

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
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Left Panel - Slogans */}
      <div className="flex-fill" style={{ overflowY: 'auto', paddingRight: '10px' }}>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="card-title mb-0">#6.1 - HOME - SLOGAN</h3>
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                style={{ width: '200px' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveSlogans}
              >
                <i className="fas fa-save mr-1"></i>
                Save
              </button>
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
                  {[0, 1, 2, 3, 4].map((index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={sloganValues[index]}
                          onChange={(e) => handleSloganChange(index, e.target.value)}
                          placeholder="Enter slogan"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            const slogan = slogans[index];
                            if (slogan) {
                              handleDeleteSlogan(slogan.id, index);
                            }
                          }}
                          className="btn btn-sm btn-danger"
                          title="Delete"
                          disabled={!slogans[index]}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Background Image */}
      <div className="card" style={{ width: '400px', marginLeft: '10px' }}>
        <div className="card-header">
          <h4 className="card-title mb-0">#6.1 - HOME - PICTURE</h4>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>Picture</label>
            <div className="mt-2">
              <div className="mb-3">
                <img
                  src={backgroundImage || DEFAULT_IMAGE}
                  alt="Background"
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '4px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== DEFAULT_IMAGE) {
                      target.src = DEFAULT_IMAGE;
                    }
                  }}
                />
                {backgroundImage && (
                  <div className="mt-2">
                    <a href={backgroundImage} target="_blank" rel="noopener noreferrer" className="text-sm">
                      {backgroundImage}
                    </a>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="d-none"
                id="background-image-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await handleBackgroundImageUpload(file);
                  }
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="background-image-upload"
                className="btn btn-primary btn-block mt-2"
                style={{ cursor: 'pointer' }}
              >
                <i className="fas fa-upload mr-1"></i>
                Upload
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

