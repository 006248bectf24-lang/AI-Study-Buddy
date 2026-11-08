import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const sendAuth = (res, status, user) =>
  res.status(status).json({
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, "Email is already registered");
  const user = await User.create({ name, email, password });
  sendAuth(res, 201, user);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  sendAuth(res, 200, user);
});

// GET /api/auth/me
export const getMe = (req, res) =>
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } });
