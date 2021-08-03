import { model, Schema } from "mongoose";

interface Prefix {
  _id: string;
  prefix: string;
}

const reqString = {
  type: String,
  required: true
}

export const prefixSchema = model<Prefix>('prefixes', new Schema({
  _id: reqString,
  prefix: reqString,
})) 