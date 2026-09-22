import { redirect } from "next/navigation";

// Kept for bookmarks: profile now lives under Settings.
export default function ProfileRedirect() {
  redirect("/settings/profile");
}
