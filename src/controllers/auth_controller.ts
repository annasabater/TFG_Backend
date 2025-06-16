import { Request, Response } from 'express';
import { registerUser, loginUser } from '../service/auth_service.js';
import { generateRefreshToken, generateToken, verifyToken } from '../utils/jwtHandler.js';
import { getUserById } from '../service/user_service.js';
import User from '../models/user_models.js';
import { randomBytes } from 'crypto';

const registerHandler = async ({ body }: Request, res: Response) => {
	if (!body) {
		return res.status(400).json({ message: 'Please provide username and password' });
	}

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%^&*_\-@]).{8,20}$/;
	if (!passwordRegex.test(body.password)) {
		return res.status(400).json({
			message: 'The password must be between 8 and 20 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one special character.'
		});
	}

	const user = await registerUser(body);
	if (!user) {
		return res.status(500).json({ message: 'Error registering user' });
	}

	if (typeof user === 'string') {
		return res.status(400).json({ message: 'User already exists' });
	}

	const { password, ...userWithoutPassword } = user.toObject();
	return res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
};

const loginHandler = async ({ body }: Request, res: Response) => {
	const credentials = { email: body.email, password: body.password };
	const resultUser = await loginUser(credentials);

	if (resultUser === 'INVALID_USER') {
		return res.status(401).json({ message: 'Invalid user or password' });
	}

	res.cookie('refreshToken', resultUser.refreshToken, {
		maxAge: 365 * 24 * 60 * 60 * 1000,
		httpOnly: true
	});
	res.cookie('accessToken', resultUser.accesstoken, {
		maxAge: 15 * 60 * 1000,
		httpOnly: true
	});

	const { password, ...userWithoutPassword } = resultUser.user.toObject();
	return res.json({
		accesstoken: resultUser.accesstoken,
		refreshToken: resultUser.refreshToken,
		user: userWithoutPassword
	});
};

const refreshTokenHandler = async (req: Request, res: Response) => {
	const refreshToken = req.cookies.refreshToken || req.body.refreshToken || req.query.refreshToken;

	if (!refreshToken) {
		console.error('No se recibió refresh token');
		return res.status(401).json({
			message: 'Refresh token required',
			receivedCookies: req.cookies
		});
	}

	try {
		const decoded = verifyToken(refreshToken);
		const user = await getUserById(decoded!.id);

		if (!user) {
			return res.status(401).json({ message: 'User not found' });
		}

		const newAccessToken = generateRefreshToken(user._id.toString());

		return res.json({
			success: true,
			refreshToken: newAccessToken
		});
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error('Error al verificar refresh token:', error.message);
			return res.status(401).json({
				message: 'Invalid refresh token',
				error: error.message
			});
		}

		console.error('Error inesperado al verificar refresh token:', String(error));
		return res.status(500).json({
			message: 'Unexpected error',
			error: String(error)
		});
	}
};

const logoutHandler = async (req: Request, res: Response) => {
	res.cookie('refreshToken', '', {
		maxAge: 0,
		httpOnly: true
	});
	res.cookie('accessToken', '', {
		maxAge: 0,
		httpOnly: true
	});
	return res.send({ message: 'Logout successful' });
};

const googleHandler = async (req: Request, res: Response) => {
	let user = await User.findOne({ email: req.body.email });

	if (!user) {
		const newUser = await registerUser({
			email: req.body.email,
			userName: req.body.displayName,
			password: randomBytes(Math.floor(Math.random() * (15 - 8 + 1)) + 8).toString(),
			role: 'Usuario'
		});

		if (!newUser) {
			return res.status(500).json({ message: 'Error registering user' });
		}

		if (typeof newUser === 'string') {
			return res.status(400).json({ message: 'User already exists' });
		}

		user = newUser;
	}

	user.password = '';
	const accesstoken = await generateToken(user._id.toString());
	const refreshToken = await generateRefreshToken(user._id.toString());

	res.status(200).json({
		accesstoken,
		refreshToken,
		user
	});
};

export { registerHandler, loginHandler, logoutHandler, refreshTokenHandler, googleHandler };
