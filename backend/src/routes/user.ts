import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { signinZod, signupZod } from "@arvind-khoisnam/medium-common";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { email, password, name } = await c.req.json();

  const { success } = signupZod.safeParse({ email, password, name });

  if (!success) {
    c.status(400);
    return c.json({ message: "Enter valid credentials" });
  }
  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        password,
        name,
      },
    });
    const jwt = await sign(
      {
        id: newUser.id,
      },
      c.env.JWT_SECRET
    );
    return c.json({ messgage: "Succesfully signed up.", token: jwt });
  } catch (err) {
    c.status(411);
    return c.json({ err });
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { email, password } = await c.req.json();
  const { success } = signinZod.safeParse({ email, password });
  if (!success) {
    c.status(411);
    return c.json({ message: "Invalid credentials" });
  }
  try {
    const foundUser = await prisma.user.findFirst({
      where: {
        email,
        password,
      },
    });
    if (!foundUser) {
      c.status(403);
      return c.json({ message: "User not found" });
    }
    const jwt = await sign({ id: foundUser?.id }, c.env.JWT_SECRET);
    return c.json({ message: "Succesfully signed in.", token: jwt });
  } catch (err) {
    return c.json({ err });
  }
});
