const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
require("dotenv").config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const port = 8081;

app.get("/", (req, res) => {
  res.send("Krishna Maurya");
});

app.listen(port, () => {
  console.log(`server is running at ${port}`);
});

app.get("/login", (req, res) => {
  console.log("login called");
  const authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });
  res.redirect(authorizeUrl);
});

app.get("/api/auth/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        },
      }
    );

    const { id_token } = tokenResponse.data;

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      // _id: payload.sub,
      email: payload.email,
      userName: payload.name,
      isVerified: true,
      isAcceptingMessage: false,
    };

    // 🔐 create JWT
    const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 🔥 IMPORTANT: redirect with data
    res.redirect(
      `http://localhost:3000/google-success?token=${accessToken}&user=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    );
  } catch (err) {
    res.redirect("http://localhost:3000/sign-in?error=google_failed");
  }
});
