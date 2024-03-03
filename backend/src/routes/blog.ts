import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { createBlogZod, updateBlogZod } from "@arvind-khoisnam/medium-common";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    id: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const auth = c.req.header("Authorization") || "";
  console.log(auth);
  try {
    const userId = await verify(auth, c.env.JWT_SECRET);
    if (userId) {
      c.set("id", userId.id);
      await next();
    } else {
      c.status(403);
      return c.json({
        messgae: "You are not authenticated. Please sign in.",
      });
    }
  } catch (err) {
    c.status(403);
    return c.json({
      messgae: "You are not authenticated. Please sign in.",
      err,
    });
  }
});

blogRouter.post("/", async (c) => {
  const { title, content, published } = await c.req.json();
  const id = c.get("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { success } = createBlogZod.safeParse({
    title,
    content,
    published,
  });

  if (!success) {
    c.status(411);
    return c.json({
      message: "Invalid input types",
    });
  }
  const post = await prisma.post.create({
    data: {
      title,
      content,
      published,
      authorId: id,
    },
  });

  return c.json({ post });
});
blogRouter.put("/", async (c) => {
  const { title, content, published, id } = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { success } = updateBlogZod.safeParse({
    title,
    content,
    published,
    id,
  });

  if (!success) {
    c.status(411);
    return c.json({
      message: "Invalid input types",
    });
  }

  const post = await prisma.post.update({
    where: {
      id: id,
    },
    data: {
      title,
      content,
      published,
    },
  });
  return c.json({ post });
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = await prisma.post.findMany({});
  return c.json({ posts });
});

blogRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.findFirst({
    where: {
      id: id,
    },
  });
  return c.json({ post });
});
