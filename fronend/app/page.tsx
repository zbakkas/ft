import MultiplayerPong from './components/MultiplayerPong'
import BabylonGame from './components/game3D'
import BabylonGame_2 from './components/game3D_2'
import MultiplayerPongGame_test from './components/test'
import MultiplayerPongGame_test2 from './components/test2'
import GameOffline from './offline/gameOffline'

export default function Home() {
  return (
    <main>
      {/* <MultiplayerPong /> */}
      {/* <MultiplayerPongGame_test2 /> */}
      {/* <BabylonGame_2 /> */}
      <GameOffline/>
    </main>
  )
}