import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import './AdminPetsPage.css';

const AdminPetsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [viewingPet, setViewingPet] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileName, setImageFileName] = useState('Click to upload');
  const [filters, setFilters] = useState({ type: [], sex: [], age: [], status: [], rescue: [] });
  const [formData, setFormData] = useState({
    name: '', type: 'Dog', sex: 'Male', age: 'Young', breed: '',
    status: 'Available', rescueStatus: 'Rescued', description: '',
    vaccinationHistory: '', medicalNotes: '', adoptionFee: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchPets();
  }, [user, navigate]);

  const getStoredImages = () => {
    try { return JSON.parse(localStorage.getItem('petImages') || '{}'); } catch { return {}; }
  };

  const fetchPets = async () => {
    try {
      const response = await api.get('/pets');
      const storedImages = getStoredImages();
      const merged = response.data.map(p => ({ ...p, imageData: storedImages[p._id] || p.imageData || null }));
      setPets(merged);
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const petData = {
      name: formData.name,
      type: formData.type,
      sex: formData.sex,
      age: formData.age,
      breed: formData.breed,
      status: formData.status,
      rescueStatus: formData.rescueStatus,
      description: formData.description,
      vaccinationHistory: formData.vaccinationHistory,
      medicalNotes: formData.medicalNotes,
      adoptionFee: Number(formData.adoptionFee) || 0
    };

    try {
      let savedPet;
      if (editingPet) {
        const response = await api.put(`/pets/${editingPet._id}`, petData);
        savedPet = response.data;
        toast.success('Pet updated successfully!');
      } else {
        const response = await api.post('/pets', petData);
        savedPet = response.data;
        toast.success('Pet added successfully!');
      }

      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const stored = getStoredImages();
          stored[savedPet._id] = reader.result;
          localStorage.setItem('petImages', JSON.stringify(stored));
          fetchPets();
        };
        reader.readAsDataURL(imageFile);
      } else {
        fetchPets();
      }

      closeFormModal();
    } catch (error) {
      console.error('Error saving pet:', error);
      toast.error(error.response?.data?.message || 'Failed to save pet');
    }
  };

  const handleDelete = async (petId) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      try {
        await api.delete(`/pets/${petId}`);
        const stored = getStoredImages();
        delete stored[petId];
        localStorage.setItem('petImages', JSON.stringify(stored));
        toast.success('Pet deleted successfully!');
        fetchPets();
      } catch (error) {
        toast.error('Failed to delete pet');
      }
    }
  };

  const openAddForm = () => {
    setEditingPet(null);
    setImageFile(null);
    setImageFileName('Click to upload');
    setFormData({
      name: '', type: 'Dog', sex: 'Male', age: 'Young', breed: '',
      status: 'Available', rescueStatus: 'Rescued', description: '',
      vaccinationHistory: '', medicalNotes: '', adoptionFee: 0
    });
    setShowFormModal(true);
  };

  const openEditForm = (pet) => {
    setEditingPet(pet);
    setImageFile(null);
    setImageFileName(pet.imageData ? 'Image loaded' : 'Click to upload');
    setFormData({
      name: pet.name, type: pet.type, sex: pet.sex, age: pet.age,
      breed: pet.breed || '', status: pet.status,
      rescueStatus: pet.rescueStatus || 'Rescued',
      description: pet.description || '',
      vaccinationHistory: pet.vaccinationHistory || '',
      medicalNotes: pet.medicalNotes || '',
      adoptionFee: pet.adoptionFee || 0
    });
    setShowViewModal(false);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingPet(null);
    setImageFile(null);
    setImageFileName('Click to upload');
  };

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const filteredPets = pets.filter(pet => {
    if (searchTerm && !pet.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.type.length && !filters.type.includes(pet.type)) return false;
    if (filters.sex.length && !filters.sex.includes(pet.sex)) return false;
    if (filters.age.length && !filters.age.includes(pet.age)) return false;
    if (filters.status.length && !filters.status.includes(pet.status)) return false;
    if (filters.rescue.length && !filters.rescue.includes(pet.rescueStatus)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-paw"></i> MANAGE PETS</h1>
          <button className="add-pet-btn" onClick={openAddForm}>
            <i className="fas fa-plus"></i> Add New Pet
          </button>
        </div>

        <div className="filter-bar">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
            <i className="fas fa-sliders-h"></i> Filter
          </button>
        </div>

        <div className="pets-table-container">
          <table className="pets-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPets.map(pet => (
                <tr key={pet._id}>
                  <td>
                    <div className="pet-image">
                      {pet.imageData ? (
                        <img src={pet.imageData} alt={pet.name} />
                      ) : (
                        <i className={`fas fa-${pet.type === 'Dog' ? 'dog' : 'cat'}`}></i>
                      )}
                    </div>
                  </td>
                  <td><strong>{pet.name}</strong></td>
                  <td>{pet.type}</td>
                  <td>
                    <span className={`status-badge ${
                      pet.status === 'Available' ? 'status-available' :
                      pet.status === 'Pending' ? 'status-pending' :
                      'status-adopted'
                    }`}>
                      {pet.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" onClick={() => { setViewingPet(pet); setShowViewModal(true); }}>
                        <i className="fas fa-eye"></i> View
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(pet._id)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPets.length === 0 && (
            <div className="no-data">No pets found</div>
          )}
        </div>
      </main>

      {/* Add / Edit Pet Modal */}
      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={closeFormModal}></i>
            <h2>{editingPet ? 'EDIT PET' : 'ADD PET FORM'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Pet Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Luna"
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="e.g., Young, Adult, Baby"
                />
              </div>
              <div className="form-group">
                <label>Breed</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="e.g., Aspin, Mixed, Persian"
                />
              </div>
              <div className="form-group">
                <label>Sex</label>
                <select value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="Adopted">Adopted</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rescue Status</label>
                <select value={formData.rescueStatus} onChange={(e) => setFormData({ ...formData, rescueStatus: e.target.value })}>
                  <option value="Rescued">Rescued</option>
                  <option value="Stray">Stray</option>
                  <option value="Surrendered">Surrendered</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the pet's personality"
                />
              </div>
              <div className="form-group">
                <label>Vaccination History</label>
                <textarea
                  rows="2"
                  value={formData.vaccinationHistory}
                  onChange={(e) => setFormData({ ...formData, vaccinationHistory: e.target.value })}
                  placeholder="List vaccinations given"
                />
              </div>
              <div className="form-group">
                <label>Medical Notes</label>
                <textarea
                  rows="2"
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  placeholder="Any medical conditions or notes"
                />
              </div>
              <div className="form-group">
                <label>Upload Image</label>
                <div className="file-input-wrapper" onClick={() => document.getElementById('petImageInput').click()}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>{imageFileName}</span>
                </div>
                <input
                  type="file"
                  id="petImageInput"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) { setImageFile(file); setImageFileName(file.name); }
                  }}
                />
              </div>
              <button type="submit" className="save-btn">
                <i className="fas fa-save"></i> Save Pet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewingPet && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowViewModal(false)}></i>
            <h2>
              PET PROFILE{' '}
              <button className="edit-inline-btn" onClick={() => openEditForm(viewingPet)}>
                <i className="fas fa-edit"></i> Edit
              </button>
            </h2>
            {viewingPet.imageData && (
              <div className="view-pet-img">
                <img src={viewingPet.imageData} alt={viewingPet.name} />
              </div>
            )}
            <div className="user-details">
              <div className="detail-row"><span className="detail-label">Name:</span><span className="detail-value">{viewingPet.name}</span></div>
              <div className="detail-row"><span className="detail-label">Age:</span><span className="detail-value">{viewingPet.age}</span></div>
              <div className="detail-row"><span className="detail-label">Sex:</span><span className="detail-value">{viewingPet.sex}</span></div>
              <div className="detail-row"><span className="detail-label">Type:</span><span className="detail-value">{viewingPet.type}</span></div>
              <div className="detail-row"><span className="detail-label">Breed:</span><span className="detail-value">{viewingPet.breed || 'Unknown'}</span></div>
              <div className="detail-row"><span className="detail-label">Rescue Status:</span><span className="detail-value">{viewingPet.rescueStatus || '—'}</span></div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={`status-badge ${
                    viewingPet.status === 'Available' ? 'status-available' :
                    viewingPet.status === 'Pending' ? 'status-pending' :
                    'status-adopted'
                  }`}>
                    {viewingPet.status}
                  </span>
                </span>
              </div>
              <div className="detail-row"><span className="detail-label">Description:</span><span className="detail-value">{viewingPet.description || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Vaccination:</span><span className="detail-value">{viewingPet.vaccinationHistory || '—'}</span></div>
              <div className="detail-row"><span className="detail-label">Medical Notes:</span><span className="detail-value">{viewingPet.medicalNotes || '—'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2>Filter Pets</h2>
            <div className="filter-group">
              <label>Type</label>
              <div className="filter-options">
                {['Dog', 'Cat'].map(v => (
                  <label key={v}><input type="checkbox" checked={filters.type.includes(v)} onChange={() => toggleFilter('type', v)} /> {v}</label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Sex</label>
              <div className="filter-options">
                {['Male', 'Female'].map(v => (
                  <label key={v}><input type="checkbox" checked={filters.sex.includes(v)} onChange={() => toggleFilter('sex', v)} /> {v}</label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Age</label>
              <div className="filter-options">
                {['Baby', 'Young', 'Adult'].map(v => (
                  <label key={v}><input type="checkbox" checked={filters.age.includes(v)} onChange={() => toggleFilter('age', v)} /> {v}</label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <div className="filter-options">
                {['Available', 'Adopted', 'Pending'].map(v => (
                  <label key={v}><input type="checkbox" checked={filters.status.includes(v)} onChange={() => toggleFilter('status', v)} /> {v}</label>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Rescue Status</label>
              <div className="filter-options">
                {['Rescued', 'Stray', 'Surrendered'].map(v => (
                  <label key={v}><input type="checkbox" checked={filters.rescue.includes(v)} onChange={() => toggleFilter('rescue', v)} /> {v}</label>
                ))}
              </div>
            </div>
            <button className="save-btn" onClick={() => setShowFilterModal(false)}>
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPetsPage;
