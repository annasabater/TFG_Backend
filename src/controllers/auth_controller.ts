import { Request, Response } from 'express';
import { registerUser, loginUser } from '../service/auth_service.js';
import { isStringObject } from 'util/types';

const registerHandler = async ({body}:Request, res:Response) => {
    if(!body) return res.status(400).json({message:"Please provide username and password"});

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%^&*_\-@]).{8,20}$/;
    if (!passwordRegex.test(body.password)) {
        return res.status(400).json({message:'The password must be between 8 and 20 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one special character.'});
    }

    const user = await registerUser(body);
    if(!user) return res.status(500).json({message:"Error registering user"});
    

    return res.status(201).json({message:"User registered successfully", user});    
}

const loginHandler = async ({body}:Request, res:Response) => {
    const credentials = {email:body.email,password:body.password};
    const resultUser = await loginUser(credentials);
    if(resultUser==="INVALID_USER") return res.status(401).json({message:"Invalid user or password"});
    res.send(resultUser);
}

export { registerHandler, loginHandler };