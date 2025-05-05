//src/utils/bcryptHandler.ts
import {hash,compare} from 'bcryptjs';

const encrypt = async (password:string) => {
    const passwordHash = await hash(password, 10);
    return passwordHash;
};

const verify = async (password:string , passwordHash:string) => {
    const isMatch = await compare(password, passwordHash);
    return isMatch;
};

export { encrypt, verify };