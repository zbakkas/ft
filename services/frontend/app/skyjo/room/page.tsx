import JoinRoom from './join_room';

export default function RoomPage({ params }: { params: { Room_name: string } }) 
{
  const { Room_name } = params; // Ensure Room_name is extracted from params
  return <JoinRoom />;
}