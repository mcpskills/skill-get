export interface PackageResponse {
  id: number;
  name: string;
  type: 'skill' | 'mcp';
  description: string | null;
  author: {
    username: string;
    avatar_url: string | null;
    trust_tier: string;
  } | null;
  repository: string | null;
  homepage: string | null;
  license: string;
  keywords: string[];
  category: string | null;
  featured: boolean;
  verified: boolean;
  downloads: number;
  rating: number | null;
  rating_count: number;
  latest_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface VersionResponse {
  version: string;
  tarball_url: string | null;
  tarball_sha256: string | null;
  readme: string | null;
  skill_md: string | null;
  config_schema: object | null;
  dependencies: string[];
  size_bytes: number | null;
  created_at: string;
}

export interface DownloadResponse {
  version: string;
  tarball_url: string | null;
  tarball_sha256: string | null;
  skill_md: string | null;
  readme: string | null;
  config_schema: object | null;
}

export interface SearchResponse {
  data: PackageResponse[];
  query: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string | null;
    avatar_url: string | null;
    trust_tier: string;
  };
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface InstalledSkill {
  name: string;
  version: string;
  path: string;
  installedAt: string;
  source: 'registry' | 'local' | 'github';
}

export interface Config {
  token?: string;
  username?: string;
  apiUrl: string;
  skillsPath: string;
  agent: string;
}

export interface PublishOptions {
  name?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  category?: string;
  license?: string;
  repository?: string;
}
