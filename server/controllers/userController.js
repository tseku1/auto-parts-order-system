import bcrypt from 'bcryptjs';
import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) return res.json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      userData: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified,
        role: user.role,
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// GET /api/user/all  →  бүх хэрэглэгч (admin only)
export const listAllUsers = async (req, res) => {
  try {
    const users = await userModel
      .find()
      .select('-password -verifyOtp -resetOtp -verifyOtpExpireAt -resetOtpExpireAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// PATCH /api/user/:id/role  →  role солих (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'us_staff', 'mn_staff', 'admin'].includes(role)) {
      return res.json({ success: false, message: 'Буруу role' });
    }
    if (req.params.id === req.userId) {
      return res.json({ success: false, message: 'Өөрийн role-оо өөрчлөх боломжгүй' });
    }

    const user = await userModel.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -verifyOtp -resetOtp -verifyOtpExpireAt -resetOtpExpireAt');

    if (!user) return res.json({ success: false, message: 'Хэрэглэгч олдсонгүй' });

    res.json({ success: true, message: 'Role амжилттай өөрчлөгдлөө', user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// POST /api/user/staff  →  ажилтан нэмэх (admin only)
export const addStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.json({ success: false, message: 'Бүх талбарыг бөглөнө үү' });
    }
    if (!['us_staff', 'mn_staff', 'admin'].includes(role)) {
      return res.json({ success: false, message: 'Буруу role' });
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: 'Энэ имэйл бүртгэлтэй байна' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      role,
      isAccountVerified: true,
    });
    await user.save();

    res.json({
      success: true,
      message: 'Ажилтан амжилттай нэмэгдлээ',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

// DELETE /api/user/staff/:id  →  ажилтан устгах (admin only)
export const removeStaff = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    if (user.role === 'customer') {
      return res.json({ success: false, message: 'Customer устгах боломжгүй' });
    }
    if (user._id.toString() === req.userId) {
      return res.json({ success: false, message: 'Өөрийгөө устгах боломжгүй' });
    }

    await userModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ажилтан устгагдлаа' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}
