import NotificationPopover from "../components/NotificationPopover";
import GameOffline from "./gameOffline";



export default function Home() {
  return (
    <main>
      <div className="display-none absolute top-0 right-0">
        <NotificationPopover />
      </div>
      <GameOffline/>

    </main>
  )
}