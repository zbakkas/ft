import NavBar from "../components/NavBar";
import Dashboard from "./Dashboard";

export default function DashboardPage() {
    return (
        <div className="bg-gradient-to-br h-screen from-slate-900 via-blue-900 to-slate-900">
        <NavBar />
        <Dashboard />
        </div>
    );
}