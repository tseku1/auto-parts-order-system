import userModel from "../models/userModel.js";

const roleAuth = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await userModel.findById(req.userId);

      if (!user) {
        return res.json({ success: false, message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      console.log('next function ajilna');
      next();
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  };
};

export default roleAuth;
