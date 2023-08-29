const { User, UserRole, Group } = require("../../models/user.model");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateAccessToken = (userData) => {
  return jwt.sign(
    {
      user: userData,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

const generateRefreshToken = (userData) => {
  return jwt.sign(
    {
      user: userData,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

const userController = {
  getAllUsers: asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    const usersWithRolesAndGroups = await Promise.all(
      users.map(async (user) => {
        const userRoles = await UserRole.find({ user_id: user._id });
        const rolesAndGroups = userRoles.map((role) => {
          return {
            role: role.role,
            group_id: role.group_id,
          };
        });

        return {
          _id: user._id,
          username: user.username,
          userRole: rolesAndGroups,
        };
      })
    );
    res.status(200).json(usersWithRolesAndGroups);
  }),

  createUser: asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const userAvailable = await User.findOne({ username });
    if (userAvailable) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ _id: user.id, username: user.username });
  }),

  loginUser: asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const userData = {
      id: user.id,
    };

    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
    });
    res.status(200).json({ accessToken });
  }),

  currentUser: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    const userRoles = await UserRole.find({ user_id: req.user.id });
    const group_id = userRoles.map((g) => {
      return g.group_id;
    });
    const group = await Group.findById(group_id);
    res.status(200).json({ user, userRoles, group });
  }),

  getUserById: asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  }),

  refreshToken: asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken;
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, user) => {
        if (err) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }

        const userData = {
          username: user.username,
          id: user.id,
        };

        const accessToken = generateAccessToken(userData);
        const newRefreshToken = generateRefreshToken(userData);
        res.cookie("refresh_token", newRefreshToken, {
          httpOnly: true,
        });
        res.status(200).json({ accessToken });
      }
    );
  }),
};

module.exports = userController;
