import bcryptjs from "bcryptjs";
import { User } from "../users/users.model";
import { RegisterInput, LoginInput } from "./auth.schema";

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw Object.assign(new Error("Email already registered"), { statusCode: 400 });
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(data.password, salt);

    const user = await User.create({
      email: data.email,
      fullName: data.fullName,
      passwordHash,
    });

    return user;
  }

  static async login(data: LoginInput) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    const isMatch = await bcryptjs.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return user;
  }
}
