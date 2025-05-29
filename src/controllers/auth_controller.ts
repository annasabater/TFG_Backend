import { Request, Response } from 'express';
import { registerUser, loginUser } from '../service/auth_service.js';
import { verifyToken } from '../utils/jwtHandler.js';
import { getUserById } from '../service/user_service.js';
import { generateRefreshToken, generateToken } from '../utils/jwtHandler.js';

const registerHandler = async ({body}:Request, res:Response) => {
    if(!body) return res.status(400).json({message:"Please provide username and password"});

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%^&*_\-@]).{8,20}$/;
    if (!passwordRegex.test(body.password)) {
        return res.status(400).json({message:'The password must be between 8 and 20 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one special character.'});
    }

    const user = await registerUser(body);
    if(!user) return res.status(500).json({message:"Error registering user"});

    if (typeof user === "string") {
        return res.status(400).json({ message: "User already exists" });
    }
    const { password, ...userWithoutPassword } = user.toObject();
    return res.status(201).json({ message: "User registered successfully", user: userWithoutPassword });
}

const loginHandler = async ({body}:Request, res:Response) => {
    const credentials = {email:body.email,password:body.password};
    const resultUser = await loginUser(credentials);
    if(resultUser==="INVALID_USER") return res.status(401).json({message:"Invalid user or password"});
    res.cookie("refreshToken", resultUser.refreshToken, {
        maxAge: 365*24*60*60*1000, // 1year
        httpOnly: true,
    });
    res.cookie("accessToken", resultUser.accesstoken, {
        maxAge: 15*60*1000, // 15min
        httpOnly: true,
    });
    const { password, ...userWithoutPassword } = resultUser.user.toObject();
    return res.json({
        accesstoken: resultUser.accesstoken,
        refreshToken: resultUser.refreshToken,
        user: userWithoutPassword
    });
}

const refreshTokenHandler = async (req:Request, res:Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken || req.query.refreshToken;
    if (!refreshToken) {
        console.error('No se recibió refresh token');
        return res.status(401).json({ 
            message: 'Refresh token required',
            receivedCookies: req.cookies // Para debug
        });
    }

    try {
        const decoded: any = verifyToken(refreshToken);
        console.log('Token decodificado:', decoded.id); // Debug

        // Verifica que el usuario exista
        const user = await getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const newAccessToken = generateRefreshToken(user._id.toString());
        
        return res.json({ 
            success: true,
            refreshToken: newAccessToken 
        });
        
    } catch (error: any) {
        console.error('Error al verificar refresh token:', error.message);
        return res.status(401).json({ 
            message: 'Invalid refresh token',
            error: error.message // Solo para desarrollo
        });
    }
}

const logoutHandler = async (req:Request, res:Response) => {
    res.cookie("refreshToken","", {
        maxAge: 0, 
        httpOnly: true,
    });
    res.cookie("accessToken", "", {
        maxAge: 0, 
        httpOnly: true,
    });
    return res.send({message:"Logout successful"});
};

const googleCallbackHandler = async (req: Request, res:Response) => {
    const user = req.user as { id: string; password?: string; [key: string]: any };
    if (!user) {
        return res.status(401).json({ message: "No user found in request" });
    }

    const userId = user.id;
    const accessToken = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);

    res.cookie("refreshToken", refreshToken, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
    });

    res.cookie("accessToken", accessToken, {
        maxAge: 15 * 60 * 1000, // 15 min
        httpOnly: true,
    });

    const userObj = typeof user.toObject === "function" ? user.toObject() : user;
    const { password, ...userWithoutPassword } = userObj;

    return res.json({
        accessToken,
        refreshToken,
        user: userWithoutPassword
    });

}

export { registerHandler, loginHandler,logoutHandler, refreshTokenHandler, googleCallbackHandler };