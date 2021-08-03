import { model, Schema } from "mongoose";

interface Role {
  _id: string,
  server: string,
  roleID: string,
}

const reqString = {
  type: String,
  required: true
}

export const defaultRoleSchema = model<Role>('default-roles', new Schema({
  _id: reqString,
  server: reqString,
  roleID: reqString,
}))

