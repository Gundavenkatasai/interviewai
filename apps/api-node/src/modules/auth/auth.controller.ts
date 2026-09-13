import { FastifyRequest, FastifyReply } from "fastify";
import { RegisterSchema, LoginSchema } from "./auth.schema";
import { AuthService } from "./auth.service";
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
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
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
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("token", { path: "/" });
    return { success: true, message: "Logged out successfully" };
  }

  static async me(request: FastifyRequest, reply: FastifyReply) {
    // Assuming auth middleware populates request.user
    if (!request.user) {
      reply.status(401).send({ success: false, message: "Unauthorized" });
      return;
    }
    
    // We can fetch fresh user data if needed, or just return jwt payload
    return {
      success: true,
      user: request.user,
    };
  }
}
