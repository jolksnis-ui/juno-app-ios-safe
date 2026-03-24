export const extractTokenFromCookie = (setCookieHeader: string | null): string | null => {
  if (!setCookieHeader) return null;
  
  // Parse Set-Cookie header to extract token value
  // Format: "token=actual_token_value; HttpOnly; SameSite=Strict"
  const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
};
