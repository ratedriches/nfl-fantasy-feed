// Single source of truth for which NFL season the public stats pages show.
// Reads the same ESPN_SEASON env var the fantasy-league features use, so
// rolling to a new season is one env-var change; the fallback only applies if
// that var is unset.
export const NFL_SEASON = Number(process.env.ESPN_SEASON) || 2026;
