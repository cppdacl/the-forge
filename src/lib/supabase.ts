import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export { SUPABASE_URL };

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  custom_avatar_path: string | null;
  bio: string | null;
  school: string | null;
  institution: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  phone: string | null;
  is_public: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  abstract: string;
  file_path: string | null;
  file_name: string | null;
  uploader_id: string;
  created_at: string;
};

export type ProjectAuthor = {
  project_id: string;
  user_id: string;
};

export type ProjectStar = {
  project_id: string;
  user_id: string;
  created_at: string;
};

export type Comment = {
  id: string;
  project_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
