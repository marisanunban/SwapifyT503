export interface UserProfile {
  id: number;
  username: string;
  credits: number;
  locationName?: string;
  nickname?: string;
  aboutMe?: string;
  profilePicture?: string;
}