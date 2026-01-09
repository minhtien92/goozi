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

export default function Picture() {
  const [pictures, setPictures] = useState<HomeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPictures();
  }, []);

  const fetchPictures = async () => {
    try {
      const response = await api.get('/home-settings');
      const allSettings = response.data.settings;

      // Get all pictures (key = 'picture' or 'background_image')
      const pictureSettings = allSettings.filter(
        (s: HomeSetting) => s.key === 'picture' || s.key === 'background_image'
      );
      pictureSettings.sort((a: HomeSetting, b: HomeSetting) => {
        // Sort by order
        return a.order - b.order;
      });
      setPictures(pictureSettings);
    } catch (error) {
      console.error('Error fetching pictures:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (value: string) => {
    if (!value) return '';
    if (value.startsWith('http')) return value;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${value}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn ảnh để upload');
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const uploadResponse = await uploadFile('/upload/image', selectedFile);
      
      if (uploadResponse.data.url) {
        // Find next order
        const maxOrder = pictures.length > 0 
          ? Math.max(...pictures.map(p => p.order)) + 1 
          : 0;

        // Save picture setting
        await api.post('/home-settings/create', {
          key: 'picture',
          value: uploadResponse.data.url,
          order: maxOrder,
          isActive: true,
        });

        // Also update background_image to use the latest picture
        await api.post('/home-settings', {
          key: 'background_image',
          value: uploadResponse.data.url,
          order: 0,
          isActive: true,
        });

        alert('Upload ảnh thành công!');
        setPreviewImage(null);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('picture-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        fetchPictures();
      }
    } catch (error: any) {
      console.error('Error uploading picture:', error);
      alert('Upload ảnh thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSetAsBackground = async (picture: HomeSetting) => {
    try {
      await api.post('/home-settings', {
        key: 'background_image',
        value: picture.value,
        order: 0,
        isActive: true,
      });
      alert('Đã đặt làm ảnh nền!');
    } catch (error: any) {
      console.error('Error setting background:', error);
      alert('Đặt ảnh nền thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeletePicture = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

    try {
      await api.delete(`/home-settings/${id}`);
      alert('Xóa ảnh thành công!');
      fetchPictures();
    } catch (error) {
      console.error('Error deleting picture:', error);
      alert('Xóa ảnh thất bại');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 200px)', gap: '10px' }}>
      {/* Left Panel - Picture List Table */}
      <div className="flex-fill" style={{ overflowY: 'auto' }}>
        <div className="card">
          <div className="card-body p-0">
            {pictures.length === 0 ? (
              <div className="text-center py-5 text-muted">
                Chưa có ảnh nào được upload
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>No</th>
                      <th style={{ width: '120px' }}>Picture</th>
                      <th>URL</th>
                      <th style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pictures.map((picture, index) => {
                      const imageUrl = getImageUrl(picture.value);
                      return (
                        <tr key={picture.id}>
                          <td>{index + 1}</td>
                          <td>
                            <div style={{ 
                              width: '100px', 
                              height: '80px',
                              overflow: 'hidden',
                              borderRadius: '4px',
                              border: '1px solid #dee2e6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f8f9fa'
                            }}>
                              <img
                                src={imageUrl}
                                alt={`Picture ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src !== DEFAULT_IMAGE) {
                                    target.src = DEFAULT_IMAGE;
                                  }
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <small className="text-muted" style={{ 
                              wordBreak: 'break-all',
                              fontSize: '12px'
                            }}>
                              {picture.value}
                            </small>
                          </td>
                          <td>
                            <div className="d-flex" style={{ gap: '5px' }}>
                              <button
                                onClick={() => handleSetAsBackground(picture)}
                                className="btn btn-sm btn-primary"
                                title="Set as Background"
                              >
                                <i className="fas fa-image"></i>
                              </button>
                              <button
                                onClick={() => handleDeletePicture(picture.id)}
                                className="btn btn-sm btn-danger"
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Upload Form */}
      <div className="card" style={{ width: '400px' }}>
        <div className="card-header">
          <h3 className="card-title mb-0">Upload Picture</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label>Picture</label>
            <div className="mt-2">
              {previewImage ? (
                <div className="mb-3">
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px', 
                      objectFit: 'cover', 
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}
                  />
                </div>
              ) : (
                <div
                  className="border border-primary d-flex align-items-center justify-content-center"
                  style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  <span className="text-muted">Chưa chọn ảnh</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="d-none"
                id="picture-upload"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="picture-upload"
                className="btn btn-primary btn-block mt-2"
                style={{ cursor: 'pointer' }}
              >
                <i className="fas fa-upload mr-1"></i>
                Upload
              </label>
              {previewImage && (
                <button
                  type="button"
                  className="btn btn-success btn-block mt-2"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-1"></i>
                      Lưu ảnh
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
