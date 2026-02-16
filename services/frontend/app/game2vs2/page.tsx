
import Game2vs2 from './game2vs2'
import Error from "@/app/components/Error";
import { verify } from "@/lib/auth";


export default async function Home() {
  let isLogged: Boolean = await verify();

  if (!isLogged) {
    return (Error({ code: 401 }));
  }
  return (
    <main>

      <Game2vs2/>
    </main>
  )
}