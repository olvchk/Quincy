import { model, Schema } from "mongoose";

interface Stats {
  _id: string,
  memberChannelID: string,
  onlineChannelID: string,
  dateChannelID: string
}

const reqString = {
  type: String,
  required: true
}
export const serverStatsSchema = model<Stats>('server-stats', new Schema({
  _id: reqString,
  memberChannelID: reqString,
  onlineChannelID: reqString,
  dateChannelID: reqString,
}))

