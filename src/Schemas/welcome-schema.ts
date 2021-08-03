import { model, Schema } from "mongoose"

interface WelcomeMessage {
  _id: string;
  serverName: string;
  channelID: string;
  text: string;
}

const reqString = {
  type: String,
  required: true
}

export const welcomeSchema = model<WelcomeMessage>('welcome-channels', new Schema({
  _id: reqString,
  serverName: reqString,
  channelID: reqString,
  text: reqString,
})) 