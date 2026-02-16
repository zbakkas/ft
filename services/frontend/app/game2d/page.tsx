
import Game2d from './test2'
import Error from "@/app/components/Error";
import { verify } from "@/lib/auth";


export default async function Home() {

  let isLogged: Boolean = await verify();

  if (!isLogged) {
    return (Error({ code: 401 }));
  }
  return (
    <main>
      <Game2d />

    </main>
  )
}