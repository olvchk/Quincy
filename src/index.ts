require("dotenv").config();

import { Intents } from "discord.js";
import Client from "./Client";

const client = new Client(
  {
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_PRESENCES,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_VOICE_STATES,
    ],
  },
  {
    testGuilds: ["793374566860718120"],
    owners: "146881888009715712",
  }
);
