import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodeMailer.js";


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
            text: `Hi ${name},\n\nThank you for registering at Auto Parts Order System! Your account has been created with email id: ${email}.\n\nBest regards,\nAuto Parts Order System Team`
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