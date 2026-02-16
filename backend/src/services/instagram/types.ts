export type IgPostStat = {
  id: string;
  timestamp: Date;
  likes: number;
  comments: number;
  saves?: number;
  views?: number;
};

export type IgSnapshotPayload = {
  source: "mock" | "connected" | "discovery";
  capturedAt: Date;
  profile: { username: string; followersCount: number; followsCount?: number; mediaCount?: number };
  posts: IgPostStat[];
};

export interface InstagramDataSource {
  fetchSnapshot(igUserId: string): Promise<IgSnapshotPayload>;
}
