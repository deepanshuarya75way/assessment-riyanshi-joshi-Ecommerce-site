import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import useAuth from '../hooks/useAuth.js';
import api from '../services/api.js';
import Button from '../components/ui/Button.jsx';

const emptyAddressForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function Checkout() {
  const { user, addAddress, updateAddress, refreshUser } = useAuth();
  const { cart, loading, error, getCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const cancelled = new URLSearchParams(location.search).get('cancelled') === 'true';

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    getCart();
  }, [user, navigate, getCart]);

  useEffect(() => {
    if (user?.addresses?.length) {
      const preferredAddress = user.addresses.find((addr) => addr.isDefault) || user.addresses[0];
      setSelectedAddressId(preferredAddress._id);
    }
  }, [user]);

  const selectedAddress = useMemo(() => {
    if (!user?.addresses?.length) return null;
    return user.addresses.find((address) => address._id === selectedAddressId)
      || user.addresses.find((address) => address.isDefault)
      || user.addresses[0];
  }, [user, selectedAddressId]);

  const subtotal = cart && Array.isArray(cart.items)
    ? cart.items.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0)
    : 0;
  const shipping = 0;
  const finalTotal = appliedCoupon?.total ?? subtotal + shipping;

  const resetAddressForm = () => {
    setAddressForm(emptyAddressForm);
    setEditingAddressId(null);
  };

  const handleAddressFormChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    const missingField = requiredFields.find((field) => !String(addressForm[field] || '').trim());

    if (missingField) {
      setFormError(`Please complete the ${missingField} field before continuing.`);
      return;
    }

    setIsSavingAddress(true);

    try {
      const payload = {
        ...addressForm,
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: (addressForm.addressLine2 || '').trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postalCode: addressForm.postalCode.trim(),
        country: addressForm.country.trim(),
      };

      const response = editingAddressId
        ? await updateAddress(editingAddressId, payload)
        : await addAddress(payload);

      const savedAddresses = response.user?.addresses || user?.addresses || [];
      const nextPreferredAddress = savedAddresses.find((address) => address.isDefault) || savedAddresses[0];

      if (nextPreferredAddress) {
        setSelectedAddressId(nextPreferredAddress._id);
      }

      setFormSuccess(editingAddressId ? 'Shipping address updated.' : 'Shipping address added.');
      setAppliedCoupon(null);
      resetAddressForm();
      await refreshUser();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to save shipping address.');
    } finally {
      setIsSavingAddress(false);
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
    });
  };

  const handleApplyCoupon = async () => {
    if(!selectedAddress)return setFormError('Select a shipping address before applyimng coupon');
    if (!couponCode.trim())return setFormError('enter valid coupon');
    setFormError('');
    setFormSuccess('');
    try{
      const response = await api.post('/orders/validate-coupon',{
        couponCode,
        shippingAddress: selectedAddress,
      });
      setAppliedCoupon(response.data.data);
      setFormSuccess(`Coupon ${response.data.data.code} applied`);
    }catch(err){
      setAppliedCoupon(null);
      setFormError(err.response?.data?.message || 'Unable to apply coupon.');
    }
  };
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setFormError('Please select a valid shipping address before placing the order.');
      return;
    }

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      setFormError('Your cart is empty. Add items before checkout.');
      return;
    }

    if (paymentMethod !== 'card') {
      setFormError('Only the card payment flow is currently available for this project.');
      return;
    }

    if(couponCode.trim() && !appliedCoupon){
      setFormError('Apply the coupon before continuing.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');

    try {
      const createOrderResponse = await api.post('/orders', {
        shippingAddress: selectedAddress,
        couponCode: couponCode.trim(),
      });

      const createdOrder = createOrderResponse.data?.data?.order || createOrderResponse.data?.order || createOrderResponse.data;
      const orderId = createdOrder?._id || createdOrder?.id;

      if (!orderId) {
        throw new Error('The order could not be created.');
      }

      const checkoutSessionResponse = await api.post(`/orders/checkout-session/${orderId}`);
      const checkoutSession = checkoutSessionResponse.data?.data || checkoutSessionResponse.data;

      if (!checkoutSession?.url) {
        throw new Error(checkoutSession?.message || 'Failed to start the payment session.');
      }

      window.location.href = checkoutSession.url;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unable to start payment.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading && !cart) {
    return <div className="py-12 text-center text-slate-500">Loading checkout...</div>;
  }

  if (error) {
    return <div className="py-12 text-center text-red-600">{error}</div>;
  }

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-semibold text-slate-900">Your cart is empty</h3>
        <p className="mt-2 text-sm text-slate-500">Start shopping to add items to your cart.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-600">Review and pay</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Checkout</h1>
        <p className="mt-2 text-sm text-slate-500">Your order total is based on the current cart prices and is rechecked when the order is created.</p>
      </div>

      {cancelled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Payment was cancelled. You can update your address or try again below.
        </div>
      )}

      {formError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {formSuccess}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Shipping address</h3>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Required</span>
            </div>

            {user.addresses?.length ? (
              <div className="space-y-3">
                {user.addresses.map((address) => (
                  <div key={address._id} className={`flex items-start gap-3 rounded-xl border p-3 ${selectedAddressId === address._id ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200'}`}>
                    <input
                      id={`shipping-address-${address._id}`}
                      type="radio"
                      name="shippingAddress"
                      checked={selectedAddressId === address._id}
                      onChange={() => {setSelectedAddressId(address._id); setAppliedCoupon(null);}}
                      className="mt-1"
                    />
                    <label htmlFor={`shipping-address-${address._id}`} className="min-w-0 flex-1 cursor-pointer text-sm text-slate-700">
                      <p className="font-medium text-slate-900">{address.fullName}</p>
                      <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                      <p>{address.country}</p>
                      <p>{address.phone}</p>
                      {address.isDefault && (
                        <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Default
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleEditAddress(address)}
                      className="min-h-10 shrink-0 px-2 text-xs font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No shipping address saved yet.
              </p>
            )}

            <form onSubmit={handleAddressSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="checkout-fullName" className="block text-sm font-medium text-slate-700">Full name</label>
                  <input id="checkout-fullName" name="fullName" value={addressForm.fullName} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="checkout-phone" className="block text-sm font-medium text-slate-700">Phone</label>
                  <input id="checkout-phone" name="phone" value={addressForm.phone} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="checkout-addressLine1" className="block text-sm font-medium text-slate-700">Street address</label>
                  <input id="checkout-addressLine1" name="addressLine1" value={addressForm.addressLine1} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="checkout-addressLine2" className="block text-sm font-medium text-slate-700">Apartment, suite, etc. (optional)</label>
                  <input id="checkout-addressLine2" name="addressLine2" value={addressForm.addressLine2} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label htmlFor="checkout-city" className="block text-sm font-medium text-slate-700">City</label>
                  <input id="checkout-city" name="city" value={addressForm.city} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label htmlFor="checkout-state" className="block text-sm font-medium text-slate-700">State</label>
                  <input id="checkout-state" name="state" value={addressForm.state} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label htmlFor="checkout-postalCode" className="block text-sm font-medium text-slate-700">Postal code</label>
                  <input id="checkout-postalCode" name="postalCode" value={addressForm.postalCode} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label htmlFor="checkout-country" className="block text-sm font-medium text-slate-700">Country</label>
                  <input id="checkout-country" name="country" value={addressForm.country} onChange={handleAddressFormChange} className="mt-1 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="primary" disabled={isSavingAddress}>
                  {isSavingAddress ? 'Saving...' : editingAddressId ? 'Save address' : 'Add address'}
                </Button>
                {editingAddressId && (
                  <Button type="button" variant="outline" onClick={resetAddressForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Order summary</h3>
            <div className="mt-4 space-y-4">
              {cart.items.map((item) => {
                const product = item.product || {};
                const productId = product._id || item.product;
                const unitPrice = Number(item.price || 0);
                const quantity = Number(item.quantity || 1);

                return (
                  <div key={productId} className="flex items-center gap-3 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name || 'Product'} className="h-14 w-14 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-400">No image</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{product.name || 'Product'}</p>
                      <p className="text-xs text-slate-500">Qty: {quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">${(unitPrice * quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4">
            <div className="mb-3 flex gap-2">
              <input
              value={couponCode}
              onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setAppliedCoupon(null);
              }} 
              placeholder = "Coupon code"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />

              <button type="button" onClick={handleApplyCoupon} className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium ">Apply</button>

            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'No charge' : `$${shipping.toFixed(2)}`}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Coupon ({appliedCoupon.discountPercent}%)</span>
                <span>-${appliedCoupon.discount.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Payment method</h4>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <div>
                <p className="font-medium text-slate-900">Card payment</p>
                <p className="text-xs text-slate-500">Card payment through Stripe Checkout</p>
              </div>
            </label>
          </div>

          <Button
            width="100%"
            variant="primary"
            disabled={isSubmitting || !selectedAddress || !cart?.items?.length}
            onClick={handlePlaceOrder}
          >
            {isSubmitting ? 'Starting payment...' : `Continue to payment - $${finalTotal.toFixed(2)}`}
          </Button>
        </aside>
      </div>
    </div>
  );
}