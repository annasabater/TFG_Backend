//src/service/auth_service.ts
import { IAuth } from "../models/auth_models.js"
import User, {IUser} from "../models/user_models.js";
import { encrypt,verify } from "../utils/bcryptHandler.js";
import { generateRefreshToken, generateToken,verifyToken } from "../utils/jwtHandler.js";

const registerUser = async (authUser:IUser) => {
    const checkIsReg = await User.findOne({email: authUser.email});
    if(checkIsReg) return "ALREDY_USER"; // User already exists and is active

    const hashedPassword = await encrypt(authUser.password);
    const newUser = new User({
        userName: authUser.userName,
        email: authUser.email,
        password: hashedPassword,
        isDeleted: false,
        role: authUser.role,
    })
    const registerNewUser = await newUser.save();

    return registerNewUser; // User registered successfully
};

const loginUser = async ({email,password}:IAuth) => {
    const checkIsLogged = await User.findOne({email});
    if(!checkIsLogged || checkIsLogged.isDeleted) return "INVALID_USER"; // User not found or deleted

    const passwordHash = checkIsLogged.password;
    const isMatch = await verify(password,passwordHash);

    if(!isMatch) return "INVALID_USER"; // Password is incorrect

    const accesstoken = generateToken(checkIsLogged._id.toString());
    const refreshToken = generateRefreshToken(checkIsLogged._id.toString()); 
    const data = {
        accesstoken: accesstoken,
        refreshToken: refreshToken,
        user: checkIsLogged
    }
    return data; // User logged in successfully
}

const refreshToken = async (refreshToken:string) => {
    console.log('Entro Service')
    const decoded = verifyToken(refreshToken);
    if(!decoded) return null; // Invalid refresh token

    const user = await User.findOne({_id:decoded.id});
    if(!user) return null; // User not found

    const newRefreshToken = generateRefreshToken(user._id.toString()); 
    const data = {
        accesToken: newRefreshToken,
        user: user
    }
    console.log('Salgo');
    return data; // Token refreshed successfully
}

export { registerUser, loginUser,refreshToken };