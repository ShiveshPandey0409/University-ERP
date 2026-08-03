import { api, tokenStore } from "./client";

export interface Me {
  username: string;
  auth: string;
  roles: number[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  auth: string;
  must_change_password: boolean;
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", { username, password });
  tokenStore.set(data.access_token, data.refresh_token);
  return data;
}

export async function fetchMe(): Promise<Me> {
  const { data } = await api.get<Me>("/auth/me");
  return data;
}
