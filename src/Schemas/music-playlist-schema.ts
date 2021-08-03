import { model, Schema } from "mongoose";

interface Playlist {
  _id: string;
  guildName: string;
  trackName: string;
  tracks: string[];
}

const reqString = {
  type: String,
  required: true,
};

export const musicPlaylistSchema = model<Playlist>(
  "music-playlist",
  new Schema({
    _id: reqString,
    guildName: reqString,
    trackName: reqString,
    tracks: {
      type: Array,
      required: true,
    },
  })
);
