import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodeMailer.js";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplete.js";

export const register = async (req, res) => {

    const{name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({success: false, message: "missing details"});
    }

    try{

        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.status(400).json({success: false, message: "email already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });
        await newUser.save();

        const token = jwt.sign({userId: newUser._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Auto Parts Order System',
          // text: `Hi ${name},\n\nThank you for registering at Auto Parts Order System! Your account has been created with email id: ${email}.\n\nBest regards,\nAuto Parts Order System Team`,
          html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };

        await transporter.sendMail(mailOptions); 

        return res.status(201).json({success: true, message: "user registered successfully", token});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({success: false, message: "email and password are required"});
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(400).json({success: false, message: "invalid email"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({success: false, message: "invalid password"});
        }

        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({success: true, message: "user logged in successfully", token});
        
    }catch(error){
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
}

export const logout = (req, res) => {
    try{
        res.clearCookie('token', { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            'none': 'strict',
        });
        return res.status(200).json({success: true, message: "user logged out successfully"});
    }catch(error){
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
}

// Send Verification OTP to the User's Email
export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account Already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      // text: `Your OTP is ${otp}. Verify your account using this OTP.`,
      html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    console.log("Sending OTP to:", user.email);
    const info = await transporter.sendMail(mailOptions);
    console.log("Mail sent:", info);

    return res.json({ success: true, message: "Verification OTP Sent on Email" });
  } catch (error) {
    console.log("sendVerifyOtp error:", error);
    return res.json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const userId = req.userId;
  const { otp } = req.body;

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!user.verifyOtp || user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" });
    }

    if (user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// check if user authenticated
export const isAuthenticated = async (req, res) => {
  try {
    return res.json({success: true});
  } catch(error) {
    res.json({ success: false, message: error.message });
  }
}

// Send Password Reset OTP
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, message: 'email is required' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      res.json({ success: false, message: "User not found." });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Reset OTP",
      // text: `Your OTP for resetting your password is ${otp}. Use this OTP to process with resetting your password.`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: 'OTP sent to your email.' });

  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
};

// reset user password
export const resetPassword = async (req, res) => {

  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: 'Email, OTP, and new password are required' });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    if (user.resetOtp === '' || user.resetOtp !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: 'OTP Expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;
    
    await user.save();

    return res.json({ success: true, message: 'Password has been reset succesfully.' });

  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};