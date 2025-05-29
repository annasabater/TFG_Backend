//src/middleware/googleAuth.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user_models.js';


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'my-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'my-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_UR || 'http://localhost:9000/api/auth/google/callback',
    },
    async (accessToken: string, _: any, profile: any, done: Function) => {
        try {
            // Busca o crea un usuari a la base de dades
            let user = await User.findOne({ email: profile.emails?.[0].value });
            if (!user) {
                user = await User.create({
                    userName: profile.displayName,
                    email: profile.emails?.[0].value,
                    password: '',
                    isDeleted: false,
                    role: ['Usuario'], // Assigna un rol per defecte
                });
            }
            return done(null, user);
        } catch (error) {
            return done(error,null);
        }
    }));

    passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: any, done: (err: any, user?: any) => void) => {
        const user = await User.findById(id);
        done(null, user);
    });

    export default passport;