const { User, UserRole, Group } = require("../../models/user.model");
const { Layer } = require("../../models/layer.model");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateAccessToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id,
      username: userData.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (userData) => {
  return jwt.sign(
    {
      id: userData.id,
      username: userData.username,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

const userController = {
  getAllUsers: asyncHandler(async (req, res) => {
    try {
      const users = await User.find().select("-password");

      const usersWithRolesAndGroups = await Promise.all(
        users.map(async (user) => {
          const userRoles = await UserRole.find({ user_id: user._id });

          const roleAndGroups = await Promise.all(
            userRoles.map(async (role) => {
              try {
                // Mencari grup berdasarkan group_id
                const group = await Group.findById(role.group_id);

                // Jika grup ditemukan, kembalikan objek dengan nama grup dan peran
                if (group) {
                  return { group: group.name, role: role.role };
                } else {
                  // Jika grup tidak ditemukan, kembalikan pesan atau nilai yang sesuai
                  return { group: "Grup tidak ditemukan", role: role.role };
                }
              } catch (error) {
                console.error(error);
                // Handle kesalahan dalam pencarian grup
                throw error;
              }
            })
          );

          return {
            _id: user._id,
            username: user.username,
            roleAndGroups,
          };
        })
      );

      res.status(200).json(usersWithRolesAndGroups);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),

  createUser: asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    try {
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
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),

  createSuperUser: asyncHandler(async (req, res) => {
    try {
      const { username, password, key } = req.body;
      if (!username || !password || !key) {
        return res.status(400).json({ message: "All fields are mandatory" });
      }

      if (key !== process.env.SUPERUSER_KEY) {
        return res.status(400).json({ message: "Invalid superuser key" });
      }

      const userAvailable = await User.findOne({ username });
      if (userAvailable) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username: username,
        password: hashedPassword,
      });

      const userRole = await UserRole.create({
        user_id: user.id,
        role: "superuser",
      });

      res.status(201).json({
        _id: user.id,
        username: user.username,
        role: userRole.role,
        permission: userRole.permission,
      });
    } catch (error) {
      console.error("Error creating superuser:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),

  loginUser: asyncHandler(async (req, res) => {
    const cookies = req.cookies;

    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    try {
      const user = await User.findOne({ username });
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }
      const role = await UserRole.find({ user_id: user.id }).exec();
      console.log(role[0].role);
      const userData = {
        id: user.id,

        username: user.username,
      };

      const accessToken = generateAccessToken(userData);
      const refreshToken = generateRefreshToken(userData);
      let newRefreshTokenArray = !cookies?.refreshToken
        ? user.refreshToken
        : user.refreshToken.filter((rt) => rt !== cookies.refreshToken);

      if (cookies?.refreshToken) {
        const refreshToken = cookies.refreshToken;
        const foundToken = await User.findOne({ refreshToken }).exec();

        if (!foundToken) {
          console.log("Attempted refresh token reuse at login!");
          newRefreshTokenArray = [];
        }

        res.clearCookie("refreshToken", {
          httpOnly: true,
          sameSite: "None",
          secure: true,
        });
      }

      user.refreshToken = [...newRefreshTokenArray, refreshToken];
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ accessToken, role: role[0].role });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),

  currentUser: asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select(
        "-password, -refreshToken"
      );
      const userRole = await UserRole.find({ user_id: req.user.id });
      const group_id = userRole.map((g) => g.group_id);
      const group = await Group.findById(group_id);
      res.status(200).json({ user, userRole, group });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),

  getUserById: asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),

  refreshToken: asyncHandler(async (req, res) => {
    const cookies = req.cookies;

    if (!cookies?.refreshToken) return res.sendStatus(401);
    const refreshToken = cookies.refreshToken;
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    console.log(refreshToken);

    const foundUser = await User.findOne({ refreshToken }).exec();

    // Detected refresh token reuse!
    console.log(!foundUser);
    if (!foundUser) {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
          if (err) return res.sendStatus(403); //Forbidden
          console.log("attempted refresh token reuse!");
          const hackedUser = await User.findOne({
            username: decoded.username,
          }).exec();
          hackedUser.refreshToken = [];
          await hackedUser.save();
          // console.log(result);
        }
      );
      return res.sendStatus(403); //Forbidden
    }

    const newRefreshTokenArray = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    // evaluate jwt
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          console.log("expired refresh token");
          foundUser.refreshToken = [...newRefreshTokenArray];
          const result = await foundUser.save();
          console.log(result);
        }
        if (err || foundUser.username !== decoded.username)
          return res.sendStatus(403);

        // Refresh token was still valid
        // const roles = Object.values(foundUser.roles);
        const userData = {
          id: foundUser.id,
          username: foundUser.username,
        };
        const accessToken = generateAccessToken(userData);

        const newRefreshToken = generateRefreshToken(userData);
        // Saving refreshToken with current user
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await foundUser.save();

        // Creates Secure Cookie with refresh token
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 24 * 60 * 60 * 1000,
        });
        const role = await UserRole.find({ user_id: foundUser.id });

        res.json({ accessToken, role: role[0].role });
      }
    );
  }),

  handleLogout: asyncHandler(async (req, res) => {
    try {
      const cookies = req.cookies;
      if (!cookies?.refreshToken) return res.sendStatus(204); // No content
      const refresh_Token = cookies.refreshToken;

      const user = await User.findOne({ refreshToken: refresh_Token }).exec();
      if (!user) {
        res.clearCookie("refreshToken", {
          httpOnly: true,
          sameSite: "None",
          secure: true,
        });
        return res.sendStatus(204);
      }

      user.refreshToken = user.refreshToken.filter(
        (rt) => rt !== refresh_Token
      );
      await user.save();

      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      res.sendStatus(204);
    } catch (error) {
      console.error("Error handling logout:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }),
};

module.exports = userController;
