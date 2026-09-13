import { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, message: "Unauthorized" });
  }
}

export async function optionalAuthenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // If token is present, decode it. If not, don't fail.
    if (request.headers.authorization || request.cookies.token) {
      await request.jwtVerify();
    }
  } catch (err) {
    // Silently ignore invalid tokens for optional endpoints
  }
}
