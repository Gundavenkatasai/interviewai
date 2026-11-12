import { FastifyRequest, FastifyReply } from "fastify";
import bcryptjs from "bcryptjs";
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
