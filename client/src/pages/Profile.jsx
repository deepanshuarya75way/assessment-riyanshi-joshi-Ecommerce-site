import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

const emptyAddressForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

export default function Profile() {
  const {
    user,
    logout,
    updateProfile,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {
    setProfileData({
      fullName: user?.fullName || '',
      username: user?.username || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    });
  }, [user]);

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      await updateProfile(profileData);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData);
      setPasswordData({ currentPassword: '', newPassword: '' });
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    const missing = requiredFields.filter((field) => !String(addressForm[field] || '').trim());
    if (missing.length) {
      setError(`Please complete all required address fields: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm);
        setSuccess('Address updated successfully');
      } else {
        await addAddress(addressForm);
        setSuccess('Address added successfully');
      }
      resetAddressForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address._id);
    setAddressForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || '',
      isDefault: Boolean(address.isDefault),
    });
    setActiveTab('addresses');
  };

  const handleDeleteAddress = async (addressId) => {
    clearFeedback();
    try {
      await deleteAddress(addressId);
      if (editingAddressId === addressId) {
        resetAddressForm();
      }
      setSuccess('Address removed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove address');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    clearFeedback();
    try {
      await setDefaultAddress(addressId);
      setSuccess('Default shipping address updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update default address');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My Account</h1>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px" role="tablist" aria-label="Account sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          onClick={() => { setActiveTab('profile'); clearFeedback(); }}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'profile'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'addresses'}
          onClick={() => { setActiveTab('addresses'); clearFeedback(); }}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'addresses'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Addresses
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'password'}
          onClick={() => { setActiveTab('password'); clearFeedback(); }}
          className={`px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'password'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Change Password
        </button>
        <button
          type="button"
          onClick={() => { navigate('/orders'); }}
          className="px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          Orders
        </button>
      </div>

      {(success || error) && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${
          success
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
            : 'border border-red-200 bg-red-50 text-red-600'
        }`}>
          {success || error}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            Email: <span className="font-medium text-slate-700">{user?.email}</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              {user?.role}
            </span>
          </p>

          <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="Phone number"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-slate-700">Avatar URL</label>
                <input
                  id="avatar"
                  name="avatar"
                  type="text"
                  value={profileData.avatar}
                  onChange={handleProfileChange}
                  placeholder="https://..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Saved Addresses</h2>
              <span className="text-sm text-slate-500">{user?.addresses?.length || 0} saved</span>
            </div>

            <div className="space-y-4">
              {(user?.addresses || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No addresses saved yet.
                </p>
              ) : (
                user.addresses.map((address) => (
                  <div key={address._id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{address.fullName}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {address.addressLine1}
                          {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                        </p>
                        <p className="text-sm text-slate-600">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-sm text-slate-600">{address.country}</p>
                        <p className="mt-1 text-sm text-slate-600">{address.phone}</p>
                        {address.isDefault && (
                          <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Default shipping address
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap justify-end gap-2 sm:max-w-[52%]">
                        <button
                          type="button"
                          onClick={() => handleEditAddress(address)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        {!address.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                          >
                            Set default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(address._id)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h2>

            <form onSubmit={handleAddressSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="address-fullName" className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  id="address-fullName"
                  name="fullName"
                  value={addressForm.fullName}
                  onChange={handleAddressChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="address-phone" className="block text-sm font-medium text-slate-700">Phone</label>
                <input
                  id="address-phone"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleAddressChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="address-line1" className="block text-sm font-medium text-slate-700">Street Address</label>
                <input
                  id="address-line1"
                  name="addressLine1"
                  value={addressForm.addressLine1}
                  onChange={handleAddressChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="address-line2" className="block text-sm font-medium text-slate-700">Apartment, suite, etc. (optional)</label>
                <input
                  id="address-line2"
                  name="addressLine2"
                  value={addressForm.addressLine2}
                  onChange={handleAddressChange}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="address-city" className="block text-sm font-medium text-slate-700">City</label>
                  <input
                    id="address-city"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="address-state" className="block text-sm font-medium text-slate-700">State</label>
                  <input
                    id="address-state"
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="address-postalCode" className="block text-sm font-medium text-slate-700">Postal Code</label>
                  <input
                    id="address-postalCode"
                    name="postalCode"
                    value={addressForm.postalCode}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="address-country" className="block text-sm font-medium text-slate-700">Country</label>
                  <input
                    id="address-country"
                    name="country"
                    value={addressForm.country}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Set as default shipping address
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingAddressId ? 'Update Address' : 'Add Address'}
                </button>

                {editingAddressId && (
                  <button
                    type="button"
                    onClick={resetAddressForm}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
