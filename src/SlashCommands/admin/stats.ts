import { scheduleJob } from "node-schedule";
import { table } from "table";
import ExtendedClient from "../../Client";
import { SlashCommand } from "../../Interfaces";
import { serverStatsSchema } from "../../Schemas/server-stats-schema";

const queue = [];
const guildCaches = [];

const schedule = (client: ExtendedClient) => {
  scheduleJob("0 */10 * * * *", async () => {
    const time = new Date(Date.now()).toLocaleTimeString("en", {
      timeZone: "Asia/Jakarta",
      timeStyle: "medium",
    });
    const date = new Date(Date.now()).toLocaleTimeString("en", {
      timeZone: "Asia/Jakarta",
      dateStyle: "full",
    });

    const data = queue.pop();
    queue.unshift(data);

    const { guildID, memberChannelID, onlineChannelID, dateChannelID } = data;
    const guild = client.guilds.cache.get(guildID);
    const memberChannel = guild.channels.cache.get(memberChannelID);
    const onlineChannel = guild.channels.cache.get(onlineChannelID);

    const dateChannel = guild.channels.cache.get(dateChannelID);
    const memberCount = guild.memberCount;
    const onlineCount = guild.members.cache.filter(
      (member) => member.presence != undefined
    ).size;

    memberChannel.setName(`Total member: ${memberCount}`);
    onlineChannel.setName(`Online: ${onlineCount}`);
    dateChannel.setName(`${date}`);

    const output = [];
    output.push(["guild", guild.name]);
    output.push(["total", memberCount]);
    output.push(["online", onlineCount]);

    console.log(`Updating guild ${guild.name} [${date} | ${time}]`);
    console.log(
      table(output, {
        header: {
          wrapWord: true,
          alignment: "center",
          content: "Update",
        },
      })
    );
  });
};
const init = async (client: ExtendedClient) => {
  const results = await serverStatsSchema.find();
  if (results) {
    for (const result of results) {
      const { memberChannelID, onlineChannelID, dateChannelID } = result;
      queue.unshift({
        guildID: result["_id"],
        memberChannelID,
        onlineChannelID,
        dateChannelID,
      });
      guildCaches.unshift(result["_id"]);
      schedule(client);
    }
  }
};

export const command: SlashCommand = {
  name: "stats",
  description: `manage server's stats`,
  options: [
    {
      name: "channel1",
      description: "total user channel mention",
      required: true,
      type: "CHANNEL",
    },
    {
      name: "channel2",
      description: "online count channel mention",
      required: true,
      type: "CHANNEL",
    },
    {
      name: "channel3",
      description: "current date channel id",
      required: true,
      type: "CHANNEL",
    },
  ],
  init,
  run: async ({ args, interaction }) => {
    const { guild } = interaction;
    const memberChannelID = args[0];
    const onlineChannelID = args[1];
    const dateChannelID = args[2];
    queue.unshift({
      guildID: guild.id,
      memberChannelID,
      onlineChannelID,
      dateChannelID,
    });

    guildCaches.unshift(guild.id);
    await serverStatsSchema.findOneAndUpdate(
      {
        _id: guild.id,
      },
      {
        _id: guild.id,
        memberChannelID,
        onlineChannelID,
        dateChannelID,
      },
      {
        upsert: true,
      }
    );

    interaction.editReply(`Successfully set status channel!`);
  },
};
