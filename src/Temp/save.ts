import { SlashCommand } from "../../Interfaces";
import { musicPlaylistSchema } from "../../Schemas/music-playlist-schema";

const cache = {};
const getPlaylistCount = (obj: {}) => {
  try {
    return Object.keys(obj)?.length;
  } catch (error) {
    return 1;
  }
};

export const command: SlashCommand = {
  name: "save",
  description: "saves current playlist",
  options: [
    {
      name: "title",
      description: "playlist title",
      type: "STRING",
    },
  ],
  init: async (client) => {
    const results = await musicPlaylistSchema.find();
    if (results) {
      for (const result of results) {
        const [id, { trackName, tracks }] = [result["_id"], result];
        cache[id] = { ...cache[id] };
        cache[id][trackName] = tracks;
      }
    }
    console.log(cache);
    for (const guildId in cache) {
      client.playlists.set(guildId, cache[guildId]);
    }
  },
  run: async ({ client, args, interaction }) => {
    const [name, { guild }] = [args.shift() ?? "Playlist #", interaction];
    const subscription = client.subscriptions.get(guild.id);

    if (subscription) {
      const tracks = subscription.playlist.map((track) => track.url);
      console.log(`Tracks: ${tracks}`);
      const trackName =
        name + getPlaylistCount(client.playlists?.get(guild.id) ?? {});

      if (tracks) {
        await musicPlaylistSchema.findOneAndUpdate(
          {
            _id: guild.id,
          },
          {
            _id: guild.id,
            guildName: guild.name,
            trackName,
            tracks,
          },
          { upsert: true }
        );
        cache[guild.id] = { ...cache[guild.id] };
        cache[guild.id][trackName] = tracks;
        client.playlists.set(guild.id, cache[guild.id]);
        interaction.editReply(
          `Saved current playlist as ${trackName}. You can now load this playlist by using /load ${trackName} command.`
        );
        return;
      }
    }

    interaction.editReply(
      `There is currently no playlist available! Please make one by playing some music!`
    );
    return;
  },
};
