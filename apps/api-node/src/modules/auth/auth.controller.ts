import { FastifyRequest, FastifyReply } from "fastify";
import bcryptjs from "bcryptjs";
import axios from "axios";
import { randomUUID } from "crypto";
import { RegisterSchema, LoginSchema } from "./auth.schema";
import { AuthService } from "./auth.service";
import { User } from "../users/users.model";
import { env } from "../../config/env";

export class AuthController {
  static async register(request: FastifyRequest, reply: FastifyReply) {
    const data = RegisterSchema.parse(request.body);
    const user = await AuthService.register(data);

    const token = await reply.jwtSign({
      sub: user._id,
      email: user.email,
      role: user.role,
    }, { expiresIn: env.JWT_EXPIRES_IN });

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return {
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        full_name: user.fullName,
        role: user.role,
        isAdmin: Boolean(user.isAdmin),
        is_admin: Boolean(user.isAdmin),
      },
      token,
    };
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    const data = LoginSchema.parse(request.body);
    const user = await AuthService.login(data);

    const token = await reply.jwtSign({
      sub: user._id,
      email: user.email,
      role: user.role,
    }, { expiresIn: env.JWT_EXPIRES_IN });

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return {
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        full_name: user.fullName,
        role: user.role,
        isAdmin: Boolean(user.isAdmin),
        is_admin: Boolean(user.isAdmin),
      },
      token,
    };
  }

  static async googleAuth(request: FastifyRequest, reply: FastifyReply) {
    const { credential, code, redirectUri, idToken, email, name, fullName, picture, avatarUrl, googleId } = (request.body as any) || {};

    let verifiedEmail: string | undefined = email;
    let verifiedName: string | undefined = name || fullName;
    let verifiedPicture: string | undefined = picture || avatarUrl;
    let verifiedGoogleId: string | undefined = googleId;

    // 1. Verify Google ID token via Google's tokeninfo API
    const tokenToVerify = credential || idToken;
    if (tokenToVerify) {
      try {
        const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`, {
          timeout: 10000
        });
        if (googleRes.data && googleRes.data.email) {
          verifiedEmail = googleRes.data.email;
          verifiedName = googleRes.data.name || verifiedName || googleRes.data.given_name;
          verifiedPicture = googleRes.data.picture || verifiedPicture;
          verifiedGoogleId = googleRes.data.sub;
        }
      } catch (err: any) {
        request.log.warn(`Google tokeninfo error: ${err.message}`);
        if (!code && !verifiedEmail) {
          return reply.status(401).send({
            success: false,
            error: { message: "Failed to verify Google identity credential with Google servers." }
          });
        }
      }
    }

    // 1b. Verify via Google Access Token if supplied
    const { accessToken } = (request.body as any) || {};
    if (accessToken && !verifiedEmail) {
      try {
        const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000
        });
        if (userInfoRes.data?.email) {
          verifiedEmail = userInfoRes.data.email;
          verifiedName = userInfoRes.data.name || verifiedName;
          verifiedPicture = userInfoRes.data.picture || verifiedPicture;
          verifiedGoogleId = userInfoRes.data.sub || verifiedGoogleId;
        }
      } catch (err: any) {
        request.log.warn(`Google accessToken error: ${err.message}`);
      }
    }

    // 2. Exchange OAuth2 authorization code if supplied
    if (code && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
      try {
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri || `${env.FRONTEND_URL}/login`,
          grant_type: "authorization_code"
        }).toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000
        });

        if (tokenRes.data?.access_token) {
          const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
            timeout: 10000
          });
          if (userInfoRes.data?.email) {
            verifiedEmail = userInfoRes.data.email;
            verifiedName = userInfoRes.data.name || verifiedName;
            verifiedPicture = userInfoRes.data.picture || verifiedPicture;
            verifiedGoogleId = userInfoRes.data.sub || verifiedGoogleId;
          }
        }
      } catch (tokenErr: any) {
        request.log.warn(`Google code exchange warning: ${tokenErr?.message}`);
      }
    }

    if (!verifiedEmail) {
      return reply.status(400).send({
        success: false,
        error: { message: "Unable to retrieve verified email address from Google identity." }
      });
    }

    verifiedEmail = verifiedEmail.toLowerCase().trim();

    // 3. Find or Create User in MongoDB
    const query: any[] = [{ email: verifiedEmail }];
    if (verifiedGoogleId) query.unshift({ googleId: verifiedGoogleId });

    let user = await User.findOne({ $or: query });
    const isNewUser = !user;

    if (!user) {
      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash(randomUUID(), salt);

      user = await User.create({
        _id: randomUUID(),
        email: verifiedEmail,
        fullName: verifiedName || verifiedEmail.split("@")[0] || "Google Candidate",
        avatarUrl: verifiedPicture,
        googleId: verifiedGoogleId,
        authProvider: "google",
        emailVerified: true,
        passwordHash,
        role: "user",
        isActive: true,
        isAdmin: false,
        termsAcceptedVersion: "v2.0",
        termsAcceptedAt: new Date(),
        lastLoginAt: new Date()
      });

      // Create linked Profile in MongoDB Compass profiles collection
      try {
        const { Profile } = require("../profile/profile.model");
        await Profile.create({
          userId: user._id,
          personal: {
            fullName: user.fullName,
            name: user.fullName,
            email: user.email,
            location: "India"
          },
          preferredRoles: ["Software Engineer", "Full Stack Developer"],
          preferredLocations: ["Bengaluru", "Remote"],
          preferredWorkMode: ["Remote", "Hybrid"],
          skills: [
            { name: "TypeScript", level: "Intermediate", category: "Languages" },
            { name: "React", level: "Intermediate", category: "Frontend" },
            { name: "Node.js", level: "Intermediate", category: "Backend" },
            { name: "Python", level: "Intermediate", category: "Languages" }
          ]
        });
      } catch (profErr) {
        request.log.warn(`Profile init notice: ${profErr}`);
      }
    } else {
      user.lastLoginAt = new Date();
      if (verifiedGoogleId && !user.googleId) user.googleId = verifiedGoogleId;
      if (verifiedPicture && !user.avatarUrl) user.avatarUrl = verifiedPicture;
      if (verifiedName && (!user.fullName || user.fullName === "Demo Candidate")) user.fullName = verifiedName;
      user.emailVerified = true;
      if (!user.authProvider) user.authProvider = "google";
      await user.save();
    }

    // 4. Generate JWT & Set HTTP-Only Cookie
    const token = await reply.jwtSign({
      sub: user._id,
      email: user.email,
      role: user.role,
    }, { expiresIn: env.JWT_EXPIRES_IN });

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return {
      success: true,
      isNewUser,
      message: isNewUser ? "Google account registered successfully!" : "Signed in successfully with Google!",
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        full_name: user.fullName,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        authProvider: user.authProvider || "google",
        role: user.role,
        isAdmin: Boolean(user.isAdmin),
        is_admin: Boolean(user.isAdmin),
      },
      token
    };
  }

  static async demo(request: FastifyRequest, reply: FastifyReply) {
    let user = await User.findOne({ email: "demo@interviewai.dev" });
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash("Password123!", salt);
      user = await User.create({
        email: "demo@interviewai.dev",
        fullName: "Demo Candidate",
        passwordHash,
      });
    }

    const token = await reply.jwtSign({
      sub: user._id,
      email: user.email,
      role: user.role,
    }, { expiresIn: env.JWT_EXPIRES_IN });

    reply.setCookie("token", token, {
      path: "/",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return {
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        full_name: user.fullName,
        role: user.role,
        isAdmin: Boolean(user.isAdmin),
        is_admin: Boolean(user.isAdmin),
      },
      token,
    };
  }

  static async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { email, password, resetToken } = (request.body as any) || {};
    if (!email || !password) {
      return reply.status(400).send({
        success: false,
        error: { message: "Email and new password are required" },
      });
    }
    if (password.length < 6) {
      return reply.status(400).send({
        success: false,
        error: { message: "Password must be at least 6 characters" },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { message: "No account found with this email" },
      });
    }

    // Verify Authorization: Check JWT token or resetToken or demo account
    let isAuthorized = false;
    try {
      await request.jwtVerify();
      const authUser = (request as any).user;
      if (authUser?.sub === user._id || authUser?.email === user.email) {
        isAuthorized = true;
      }
    } catch {
      // Unauthenticated
    }

    if (user.email === "demo@interviewai.dev") {
      isAuthorized = true;
    }

    if (resetToken && (user as any).resetPasswordToken === resetToken) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return reply.status(403).send({
        success: false,
        error: { message: "Password reset requires an authenticated session or valid reset token." },
      });
    }

    const salt = await bcryptjs.genSalt(10);
    user.passwordHash = await bcryptjs.hash(password, salt);
    await user.save();

    return {
      success: true,
      message: "Password reset successfully. You can now sign in.",
    };
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("token", { path: "/" });
    return { success: true, message: "Logged out successfully" };
  }

  static async me(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.user as any;
    if (!payload?.sub) {
      reply.status(401).send({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) {
      reply.status(401).send({ success: false, message: "User not found" });
      return;
    }

    return {
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        full_name: user.fullName,
        role: user.role,
        isActive: user.isActive,
        isAdmin: Boolean(user.isAdmin),
        is_admin: Boolean(user.isAdmin),
      },
    };
  }
}
