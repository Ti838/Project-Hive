import User from '../models/User.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.utils.js';

export async function register(req, res, next) {
  try {
    const { firstName, lastName, email, password, university, major, yearOfStudy } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      university,
      major,
      yearOfStudy,
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id.toString(), user.email);

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    console.log('[v0] User registered:', user.email);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        university: user.university,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[v0] Register error:', error);
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id.toString(), user.email);

    // Store refresh token (keep last 5 tokens for multiple device support)
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    console.log('[v0] User logged in:', user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        university: user.university,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[v0] Login error:', error);
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if refresh token is in user's token list
    if (!user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user._id.toString(), user.email);

    // Update refresh token (rotate it)
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);

    await user.save();

    console.log('[v0] Token refreshed for user:', user.email);

    res.json({
      message: 'Token refreshed',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('[v0] Refresh token error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    if (refreshToken) {
      // Remove the specific refresh token
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    console.log('[v0] User logged out:', req.user.email);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[v0] Logout error:', error);
    next(error);
  }
}
