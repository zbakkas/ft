import NavBar from "@/app/components/NavBar";
import Dashboard from "./dashboard";
import Error from "@/app/components/Error";
import { verify } from "@/lib/auth";

export default async function Page() {
  let isLogged: Boolean = await verify();

  if (!isLogged) {
    return (Error({ code: 401 }));
  }

  return (
    <>
      <NavBar />
      <Dashboard />
    </>
  );
}
