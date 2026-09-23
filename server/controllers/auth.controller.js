import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';

const ensureAddressIds = (user) => {
  let changed = false;

  user.addresses = (user.addresses || []).map((address) => {
    const plainAddress = address?.toObject ? address.toObject() : address;

    if (!plainAddress?._id) {
      changed = true;
      return {
        ...plainAddress,
        _id: new mongoose.Types.ObjectId(),
      };
    }

    return plainAddress;
  });

  if (changed) {
    user.markModified('addresses');
  }

  return changed;
};

const serializeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  addresses: user.addresses || [],
  createdAt: user.createdAt,
});

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      user: serializeUser(user),
    });
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { fullName, username, email, password } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken',
      });
    }

    const user = await User.create({
      fullName,
      username,
      email,
      password,
      role: 'customer',
    });

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    console.error('[register] Error:', error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +isActive'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

export const logout = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    res
      .clearCookie('token', cookieOptions)
      .json({
        success: true,
        message: 'Logged out successfully',
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (ensureAddressIds(user) && user) {
      await user.save();
    }

    return res.status(200).json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user information',
    });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (ensureAddressIds(user)) {
      await user.save();
    }

    return res.status(200).json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
    });
  }
};

const validateAddressPayload = (address) => {
  const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
  const missing = requiredFields.filter((field) => !String(address[field] || '').trim());

  if (missing.length) {
    return `Please complete all required address fields: ${missing.join(', ')}`;
  }

  return null;
};

export const addAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user._id);
    if (ensureAddressIds(user)) {
      await user.save();
    }

    const addressData = { ...req.body };
    const validationError = validateAddressPayload(addressData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const normalizedAddress = {
      fullName: addressData.fullName.trim(),
      phone: addressData.phone.trim(),
      addressLine1: addressData.addressLine1.trim(),
      addressLine2: (addressData.addressLine2 || '').trim(),
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      postalCode: addressData.postalCode.trim(),
      country: addressData.country.trim(),
      isDefault: Boolean(addressData.isDefault) || user.addresses.length === 0,
    };

    if (normalizedAddress.isDefault) {
      user.addresses = user.addresses.map((item) => ({ ...item.toObject?.() || item, isDefault: false }));
    }

    user.addresses.push(normalizedAddress);
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add address',
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    if (ensureAddressIds(user)) {
      await user.save();
    }

    const index = user.addresses.findIndex((address) => address._id.toString() === addressId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    const currentAddress = user.addresses[index].toObject ? user.addresses[index].toObject() : user.addresses[index];
    const updatedAddress = {
      ...currentAddress,
      ...req.body,
      fullName: (req.body.fullName || currentAddress.fullName).trim(),
      phone: (req.body.phone || currentAddress.phone).trim(),
      addressLine1: (req.body.addressLine1 || currentAddress.addressLine1).trim(),
      addressLine2: (req.body.addressLine2 ?? currentAddress.addressLine2 ?? '').trim(),
      city: (req.body.city || currentAddress.city).trim(),
      state: (req.body.state || currentAddress.state).trim(),
      postalCode: (req.body.postalCode || currentAddress.postalCode).trim(),
      country: (req.body.country || currentAddress.country).trim(),
    };

    const validationError = validateAddressPayload(updatedAddress);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (req.body.isDefault === true || (req.body.isDefault === undefined && user.addresses.length === 1)) {
      user.addresses = user.addresses.map((address) => ({
        ...((address.toObject && address.toObject()) || address),
        isDefault: false,
      }));
      updatedAddress.isDefault = true;
    } else {
      updatedAddress.isDefault = Boolean(updatedAddress.isDefault);
    }

    user.addresses[index] = updatedAddress;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update address',
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    if (ensureAddressIds(user)) {
      await user.save();
    }

    const index = user.addresses.findIndex((address) => address._id.toString() === addressId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    const [removedAddress] = user.addresses.splice(index, 1);
    if (removedAddress?.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete address',
    });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    if (ensureAddressIds(user)) {
      await user.save();
    }

    const index = user.addresses.findIndex((address) => address._id.toString() === addressId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    user.addresses = user.addresses.map((address) => ({
      ...((address.toObject && address.toObject()) || address),
      isDefault: false,
    }));
    user.addresses[index].isDefault = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Default shipping address updated',
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update default address',
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const allowedFields = ['fullName', 'username', 'phone', 'avatar'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.username && updates.username !== req.user.username) {
      const existing = await User.findOne({ username: updates.username });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'This username is already taken',
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};
