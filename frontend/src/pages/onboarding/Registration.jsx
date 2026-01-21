import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';

const categories = [
  'Restaurant',
  'Grocery',
  'Pharmacy',
  'Clothing',
  'Electronics',
  'Home & Garden',
  'Beauty & Health',
  'Books & Stationery',
  'Sports & Fitness',
  'Automotive',
  'Services',
  'Other'
];

export default function Registration() {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    category: '',
    description: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    },
    businessLicense: '',
    taxId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('socialMedia.')) {
      const platform = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [platform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Shop registration submitted successfully!');
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="registration-bg">
      <div className="registration-container">
        <header className="registration-header">
          <h1>Shop Registration</h1>
          <p>Join our hyperlocal marketplace and start selling to your community</p>
        </header>
        <form onSubmit={handleSubmit} className="registration-form">
          <section>
            <h2>Basic Information</h2>
            <div className="registration-grid">
              <div>
                <label>Shop Name *</label>
                <input type="text" name="shopName" value={formData.shopName} onChange={handleInputChange} required />
              </div>
              <div>
                <label>Owner Name *</label>
                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleInputChange} required />
              </div>
              <div>
                <label>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div>
                <label>Phone *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
              </div>
              <div className="full-width">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="full-width">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} />
              </div>
            </div>
          </section>
          <section>
            <h2>Address Information</h2>
            <div className="registration-grid">
              <div className="full-width">
                <label>Street Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>
              <div>
                <label>City *</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} required />
              </div>
              <div>
                <label>State *</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} required />
              </div>
              <div>
                <label>ZIP Code *</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
              </div>
            </div>
          </section>
          <section>
            <h2>Online Presence</h2>
            <div className="registration-grid">
              <div className="full-width">
                <label>Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleInputChange} />
              </div>
              <div>
                <label>Facebook</label>
                <input type="url" name="socialMedia.facebook" value={formData.socialMedia.facebook} onChange={handleInputChange} />
              </div>
              <div>
                <label>Instagram</label>
                <input type="url" name="socialMedia.instagram" value={formData.socialMedia.instagram} onChange={handleInputChange} />
              </div>
              <div>
                <label>Twitter</label>
                <input type="url" name="socialMedia.twitter" value={formData.socialMedia.twitter} onChange={handleInputChange} />
              </div>
            </div>
          </section>
          <section>
            <h2>Business Information</h2>
            <div className="registration-grid">
              <div>
                <label>Business License Number</label>
                <input type="text" name="businessLicense" value={formData.businessLicense} onChange={handleInputChange} />
              </div>
              <div>
                <label>Tax ID</label>
                <input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} />
              </div>
            </div>
          </section>
          <div className="registration-actions">
            <button type="submit" disabled={isSubmitting} className="registration-submit">
              {isSubmitting ? 'Registering...' : 'Register Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
