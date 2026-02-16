import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const IgSnapshotSchema = new Schema(
  {
    influencerId: { type: Schema.Types.ObjectId, ref: "Influencer", required: true, index: true },
    source: { type: String, enum: ["mock", "connected", "discovery"], required: true },
    capturedAt: { type: Date, required: true, index: true },

    profile: {
      username: String,
      followersCount: Number,
      followsCount: Number,
      mediaCount: Number
    },

    posts: [
      {
        id: String,
        timestamp: Date,
        likes: Number,
        comments: Number,
        saves: Number,
        views: Number
      }
    ]
  },
  { timestamps: true }
);

IgSnapshotSchema.index({ influencerId: 1, capturedAt: -1 });

export type IgSnapshot = InferSchemaType<typeof IgSnapshotSchema>;
export const IgSnapshotModel = model("IgSnapshot", IgSnapshotSchema);
