import { getGatewayUrl } from "@/lib/gateway";

export interface UserProfile {
  username: string;
  avatarUrl: string;
}

export const fetchUserProfile = async (id: string): Promise<UserProfile> => {
  try {
    const response = await fetch(getGatewayUrl(`/api/v1/user-mgmt/${id}`), {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    
    const data = await response.json();
    const fullAvatarUrl = getGatewayUrl(`/api/v1/user-mgmt/@${data.username}/avatar`);

    return {
      username: data.username,
      avatarUrl: fullAvatarUrl
    };
  } catch (error) {
    console.error(`Error fetching profile for ${id}:`, error);
    return { 
      username: 'Unknown Player', 
      avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' 
    }; 
  }
};
