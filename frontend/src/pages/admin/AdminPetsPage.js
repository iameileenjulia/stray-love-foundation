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
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Dog',
    sex: 'Male',
    age: 'Young',
    breed: '',
    status: 'Available',
    rescueStatus: 'Rescued',
    description: '',
    vaccinationHistory: '',
    medicalNotes: '',
    adoptionFee: 0,
    imageData: null
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchPets();
  }, [user, navigate]);

  const fetchPets = async () => {
    try {
      const response = await api.get('/pets');
      setPets(response.data);
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
      adoptionFee: Number(formData.adoptionFee) || 0,
      imageData: formData.imageData
    };

    try {
      if (editingPet) {
        await api.put(`/pets/${editingPet._id}`, petData);
        toast.success('Pet updated successfully!');
      } else {
        await api.post('/pets', petData);
        toast.success('Pet added successfully!');
      }
      fetchPets();
      setShowModal(false);
      setEditingPet(null);
      setFormData({
        name: '',
        type: 'Dog',
        sex: 'Male',
        age: 'Young',
        breed: '',
        status: 'Available',
        rescueStatus: 'Rescued',
        description: '',
        vaccinationHistory: '',
        medicalNotes: '',
        adoptionFee: 0,
        imageData: null
      });
    } catch (error) {
      console.error('Error saving pet:', error);
      toast.error(error.response?.data?.message || 'Failed to save pet');
    }
  };

  const handleDelete = async (petId) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      try {
        await api.delete(`/pets/${petId}`);
        toast.success('Pet deleted successfully!');
        fetchPets();
      } catch (error) {
        toast.error('Failed to delete pet');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageData: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (pet = null) => {
    if (pet) {
      setEditingPet(pet);
      setFormData({
        name: pet.name,
        type: pet.type,
        sex: pet.sex,
        age: pet.age,
        breed: pet.breed || '',
        status: pet.status,
        rescueStatus: pet.rescueStatus,
        description: pet.description,
        vaccinationHistory: pet.vaccinationHistory || '',
        medicalNotes: pet.medicalNotes || '',
        adoptionFee: pet.adoptionFee || 0,
        imageData: pet.imageData || null
      });
    } else {
      setEditingPet(null);
      setFormData({
        name: '',
        type: 'Dog',
        sex: 'Male',
        age: 'Young',
        breed: '',
        status: 'Available',
        rescueStatus: 'Rescued',
        description: '',
        vaccinationHistory: '',
        medicalNotes: '',
        adoptionFee: 0,
        imageData: null
      });
    }
    setShowModal(true);
  };

  const filteredPets = pets.filter(pet => {
    if (searchTerm && !pet.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
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
          <button className="add-pet-btn" onClick={() => openModal()}>
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
        </div>

        <div className="pets-table-container">
          <table className="pets-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Sex</th>
                <th>Age</th>
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
                  <td>{pet.sex}</td>
                  <td>{pet.age}</td>
                  <td>
                    <span className={`status-badge ${pet.status === 'Available' ? 'status-available' : 'status-adopted'}`}>
                      {pet.status}
                    </span>
                   </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" onClick={() => openModal(pet)}>
                        <i className="fas fa-edit"></i> Edit
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowModal(false)}></i>
            <h2>{editingPet ? 'EDIT PET' : 'ADD NEW PET'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Pet Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sex</label>
                  <select value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <select value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}>
                    <option value="Baby">Baby</option>
                    <option value="Young">Young</option>
                    <option value="Adult">Adult</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
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
              <div className="form-row">
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
                  <label>Adoption Fee (PHP)</label>
                  <input
                    type="number"
                    value={formData.adoptionFee}
                    onChange={(e) => setFormData({ ...formData, adoptionFee: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the pet's personality, behavior, etc."
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
                <div className="file-input-wrapper" onClick={() => document.getElementById('petImage').click()}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>{formData.imageData ? 'Image selected' : 'Click to upload image'}</span>
                </div>
                <input type="file" id="petImage" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </div>
              <button type="submit" className="save-btn">
                <i className="fas fa-save"></i> {editingPet ? 'Update Pet' : 'Save Pet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPetsPage;
