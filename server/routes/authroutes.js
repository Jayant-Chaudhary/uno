const express = require("express");

const router = express.Router();

const passport = require("passport");

const authController = require("../controllers/authcontroller");

const authMiddleware = require("../middleware/authmiddleware");

router.post("/signup", authController.signup);

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password/:token", authController.resetPassword);

router.get(
  "/google",

  passport.authenticate("google", {
    scope: ["profile", "email"],

    session: false,
  }),
);

router.get(
  "/google/callback",

  passport.authenticate("google", {
    session: false,
    failureRedirect: process.env.CLIENT_API ? `${process.env.CLIENT_API}/auth` : "http://localhost:5173/auth",
  }),

  authController.googleSuccess,
);
router.get("/me", authMiddleware, authController.me);
router.patch("/avatar", authMiddleware, authController.updateAvatar);

router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
