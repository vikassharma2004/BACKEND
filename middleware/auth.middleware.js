
import jwt from "jsonwebtoken"
import { User } from "../model/user.model.js";
export const isAuthenticated =async (req, res, next) => { 

    try {
		const accessToken = req.cookies.access_token;

		if (!accessToken) {
			return res.status(401).json({ message: "Unauthorized " });
		}

		try {
          
            
			const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
          
            
			const user = await User.findById(decoded.user_id).select("-password");

			if (!user) {
				return res.status(401).json({ message: "User not found" });
			}

			req.user = user;

			next();
		} catch (error) {
			if (error.name === "TokenExpiredError") {
				return res.status(401).json({ message: "Unauthorized - Access token expired" });
			}
			throw error;
		}
	} catch (error) {
		console.log("Error in protectRoute middleware", error.message);
		return res.status(401).json({ message: "Unauthorized - Invalid access token" });
	}
}   ;

export const adminRoute = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - Admin only" });
	}
};