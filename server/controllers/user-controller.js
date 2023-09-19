const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto=require("crypto");
const { sendVerificationMail } = require("../utils/sendVerificationMail");



const signup = async (req, res, next) => {
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.log(err);
  }
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User already exists! Login Instead" });
     
  }
  const hashedPassword = bcrypt.hashSync(password);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    emailToken:crypto.randomBytes(64).toString("hex"),

  });

  try {
    await user.save();
    sendVerificationMail(user);
  } catch (err) {
    console.log(err);
  }
  return res.status(201).json({ message: user });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return new Error(err);
  }
  if (!existingUser) {
    return res.status(400).json({ message: "User not found. Signup Please" });
  }
  const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Inavlid Email / Password" });
  }
  const token = jwt.sign({ id: existingUser._id }, 'MyKey', {
    expiresIn: "7d",
  });

  if (req.cookies[`${existingUser._id}`]) {
    req.cookies[`${existingUser._id}`] = "";
  }

  res.cookie(String(existingUser._id), token, {
    path: "/",
    expires: new Date(Date.now() + 1000 * 3600), // 30 seconds
    httpOnly: true,
    sameSite: "lax",
  });

  return res
    .status(200)
    .json({ message: "Successfully Logged In", user: existingUser, token });
};

const verifyToken = (req, res, next) => {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return res.status(404).json({ message: "No token found" });
  }
  const tokenCookie = cookies.split("=")[1];
  if (!tokenCookie) {
    return res.status(404).json({ message: "No token found" });
  }
  const token = tokenCookie.split(";")[0]; // Get the token part before the first semicolon if it exists

  jwt.verify(String(token),'MyKey', (err, user) => {
    if (err) {
      return res.status(400).json({ message: "Invalid Token" });
    }
    req.id = user.id;
    next();
  });
};

const getUser = async (req, res, next) => {
  const userId = req.id;
  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    return new Error(err);
  }
  if (!user) {
    return res.status(404).json({ messsage: "User Not FOund" });
  }
  return res.status(200).json({ user });
};
const refreshToken = (req, res, next) => {
  const cookies = req.headers.cookie;
  const prevToken = cookies.split("=")[1];
  if (!prevToken) {
    return res.status(400).json({ message: "Couldn't find token" });
  }
  jwt.verify(String(prevToken), 'MyKey', (err, user) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ message: "Authentication failed" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user.id}`] = "";

    const token = jwt.sign({ id: user.id }, 'MyKey', {
      expiresIn: "7d",
    });
    console.log("Regenerated Token\n", token);

    res.cookie(String(user.id), token, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 30000), // 30 seconds
      httpOnly: true,
      sameSite: "lax",
    });

    req.id = user.id;
    next();
  });
};

// user-controller.js

const logout = (req, res) => {
  try {
    // Check if there's a token in cookies
    const tokenCookie = req.cookies.token;
    if (!tokenCookie) {
      return res.status(400).json({ message: "Token not found" });
    }

    // Verify the token
    jwt.verify(tokenCookie, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error(err);
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Token is valid, clear the cookie
      res.clearCookie("token");
      return res.status(200).json({ message: "Successfully logged out" });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

// Import your User model and other required modules

const verifyEmail = async (req, res) => {
  try {
    const emailToken = req.params.emailToken;

    if (!emailToken) {
      console.log("No email token provided.");
      return res.status(400).json({ isVerified: false });
    }

    const user = await User.findOne({ emailToken });

    if (user) {
      if (user.isVerified) {
        console.log("Email is already verified.");
        return res.status(200).json({ isVerified: true });
      }

      console.log("Email token matched. Verifying email...");
      user.emailToken = null;
      user.isVerified = true;
      await user.save();

      console.log("Email verified successfully.");
      return res.status(200).json({ isVerified: true });
    } else {
      console.log("Email token not found in the database.");
      return res.status(404).json({ isVerified: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ isVerified: false });
  }
};




exports.logout = logout;
exports.signup = signup;
exports.login = login;
exports.verifyToken = verifyToken;
exports.getUser = getUser;
exports.refreshToken = refreshToken;
exports.verifyEmail=verifyEmail;