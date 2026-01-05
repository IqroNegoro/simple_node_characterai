export interface Profile {
  user: {
    username: string;
    id: number;
    first_name: string;
    account: {
      name: string;
      avatar_type: string | 'DEFAULT';
      onboarding_complete: boolean;
      avatar_file_name: string;
      mobile_onboarding_complete: boolean | null;
    };
    is_staff: boolean;
    subscription: any | null;
    entitlements: any[];
  };
  is_human: boolean;
  name: string;
  email: string;
  date_joined: string;
  needs_to_acknowledge_policy: boolean;
  suspended_until: string | null;
  hidden_characters: any[];
  blocked_users: any[];
  bio: string;
  interests: any | null;
  date_of_birth: string;
}