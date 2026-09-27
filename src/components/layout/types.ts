import type { ModalKind, View } from "../../lib/types";

export type { ModalKind, View };

export interface UserLike {
  email?: string;
  isLocal?: boolean;
  user_metadata?: Record<string, unknown> & { full_name?: string; avatar_url?: string };
}
