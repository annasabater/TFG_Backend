import { IAuth } from "../models/auth_models.js"
import User, {IUser} from "../models/user_models.js";
import { encrypt,verify } from "../utils/bcryptHandler.js";
import { generateToken } from "../utils/jwtHandler.js";

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
    if(!checkIsLogged) return "INVALID_USER"; // User not found or deleted

    const passwordHash = checkIsLogged.password;
    const isMatch = await verify(password,passwordHash);

    if(!isMatch) return "INVALID_USER"; // Password is incorrect

    const accestoken = generateToken(checkIsLogged._id.toString());
    const data = {
        token: accestoken,
        user: checkIsLogged
    }
    return data; // User logged in successfully
}

export { registerUser, loginUser };