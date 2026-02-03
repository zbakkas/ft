import GameOptions from "./components/GameOptions";
import NavBar from "./components/NavBar";
import Head from "next/head";

export default function Page() {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <NavBar />
      <GameOptions />
    </>
  );
}
