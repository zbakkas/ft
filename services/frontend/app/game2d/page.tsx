
import Game2d from './test2'
import Error from "@/app/components/Error";
import { verify } from "@/lib/auth";
import NotificationPopover from "@/app/components/NotificationPopover";


export default async function Home() {

  let isLogged: Boolean = await verify();

  if (!isLogged) {
    return (Error({ code: 401 }));
  }
  return (
    <main>
      <div className="display-none absolute top-0 right-0">
        <NotificationPopover />
      </div>
      <Game2d />

    </main>
  )
}