// eslint-disable-next-line semi
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  // eslint-disable-next-line no-unused-vars
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
    };
  }
}
