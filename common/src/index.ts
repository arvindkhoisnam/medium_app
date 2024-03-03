import z from "zod";

export const signupZod = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
});

export const signinZod = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createBlogZod = z.object({
  title: z.string(),
  content: z.string(),
  published: z.boolean(),
});

export const updateBlogZod = z.object({
  title: z.string(),
  content: z.string(),
  published: z.boolean(),
  id: z.string(),
});

//type inference in zod
export type SignupZod = z.infer<typeof signupZod>;
export type Signin = z.infer<typeof signinZod>;
export type CreateBlogZod = z.infer<typeof createBlogZod>;
export type UpdateBlogZod = z.infer<typeof updateBlogZod>;
