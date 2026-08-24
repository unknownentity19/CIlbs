/**
 * Which sign-in methods a deployment offers.
 *
 * Resolved on the server and passed down as a prop, not fetched by the
 * browser. The two halves are independent: OAuth runs with no database at all
 * (JWT sessions), while email and password need somewhere to keep the hash,
 * so a database-less deployment offers only the former.
 */
export type AuthProviders = {
  /** Configured OAuth provider ids, in display order. */
  oauth: string[];
  /** Whether email + password sign-in is available. */
  credentials: boolean;
};
