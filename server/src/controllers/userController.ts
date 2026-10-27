import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { logActivity } from '../utils/auditLogger.js';

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find()
      .populate('assignedClasses', 'name grade')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role = 'teacher', phone, assignedClasses } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone,
      assignedClasses: assignedClasses || [],
      isActive: true,
    });

    await logActivity({
      req,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, phone, assignedClasses, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (assignedClasses) user.assignedClasses = assignedClasses;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await logActivity({
      req,
      action: 'USER_UPDATE',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, role: user.role, isActive: user.isActive },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    const user = await User.findById(id).select('+passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logActivity({
      req,
      action: 'USER_PASSWORD_RESET_BY_ADMIN',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email },
    });

    res.json({
      success: true,
      message: `Password for ${user.name} reset successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
