import NavBar from "../components/NavBar";
import Leaderboard from "./Leaderboard";

export default function LeaderboardPage() {
    return(
        <div className="bg-gradient-to-br h-screen from-slate-900 via-blue-900 to-slate-900">


        <NavBar/>
        <Leaderboard/>
        </div>
    );
}