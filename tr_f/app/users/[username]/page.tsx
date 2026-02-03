import { FC } from "react";
import Dashboard from "./dashboard";
import NavBar from "@/app/components/NavBar";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import Error from "@/app/components/Error";
import { verify } from "@/lib/auth";
import { RlContextProvider } from "@/app/context/RlContext";
import { GetRelation } from "@/lib/GetRelation";

interface UserPageProps {
  params: {
    username: string;
  };
}

const UserPage: FC<UserPageProps> = async ({ params }) => {
  const { username } = await params;
  let isLogged: Boolean = await verify();

  const cookieStore: ReadonlyRequestCookies = await cookies();
  const token: string | null = cookieStore.get("token")?.value || null;

  if (!isLogged) {
    return (Error({ code: 401 }));
  }

  const relation = await GetRelation(username, token);

  return (
    <>
      <NavBar />
      <RlContextProvider initialRelation={relation}>
        {await Dashboard(username, token)}
      </RlContextProvider>
    </>
  );
};

export default UserPage;
