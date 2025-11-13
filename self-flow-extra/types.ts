
export interface WebInfo {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: WebInfo;
}

export interface SocialMediaHandles {
  youtube?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  linkedin?: string;
}

export interface PersonInfo {
  name: string;
  role: string;
  email?: string;
  socialMedia?: SocialMediaHandles;
}

export interface ScrapedContactInfo {
  url: string;
  emails: string[];
  socialMedia: SocialMediaHandles;
  people: PersonInfo[];
}
