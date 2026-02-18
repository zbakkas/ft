import NotificationPopover from "../components/NotificationPopover";
import AI from "./Ai";

export default function Home() {
  return (
    <main>
      <div className="display-none absolute top-0 right-0">
        <NotificationPopover />
      </div>
      <AI/>

    </main>
  )
}