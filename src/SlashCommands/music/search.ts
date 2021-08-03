import {
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
  MessageSelectOption,
  MessageSelectOptionData,
} from "discord.js";
import ytsr from "ytsr";
import { SlashCommand } from "../../Interfaces";

interface Result {
  video: {
    title: string;
    url: string;
  };
  author: {
    title: string;
    url: string;
  };
}

const split = (arr, size: number) => {
  const res = [];
  while (arr.length > 0) {
    const chunk = arr.splice(0, size);
    res.push(chunk);
  }
  return res;
};

const getDesc = (pages: Result[][], index: number) => {
  return pages[index]
    .map((item, i) => {
      const idx = ((i + 1 + index * 10).toString() + ".")
        .padStart(3, "\u2005")
        .padEnd(5, "\u2005");
      const title = `[${item.video.title}](${item.video.url})`;
      const author = `${"".padEnd(5, "\u2005")}**${item.author.title}**\n`;
      return `${author}${idx}${title}`;
    })
    .join("\n");
};

export const command: SlashCommand = {
  name: "search",
  description: "search a query from youtube",
  options: [
    {
      name: "query",
      description: "a query to search",
      type: "STRING",
      required: true,
    },
    {
      name: "type",
      description: "type of query",
      type: "STRING",
      choices: [
        {
          name: "video",
          value: "video",
        },
        {
          name: "playlist",
          value: "playlist",
        },
      ],
    },
    {
      name: "limit",
      description: "expected max result, default on 20, up to 256",
      type: "INTEGER",
    },
  ],
  run: async ({ client, args, interaction }) => {
    const query = args.shift();
    const type =
      args[0] && typeof args[0] === "string" ? args.shift() : "video";
    const limit = args[0] && typeof args[0] === "number" ? args.shift() : 20;
    const { channel } = interaction;
    const items = (
      await ytsr(query, {
        limit: 256,
      })
    ).items
      .filter((item) => item.type === type)
      .map((item) => {
        if (item.type === "video") {
          return {
            video: {
              title: item.title,
              url: item.url,
            },
            author: {
              title: item.author.name,
              url: item.author.url,
            },
          };
        }

        if (item.type === "playlist") {
          return {
            video: {
              title: item.title,
              url: item.url,
            },
            author: {
              title: item.owner.name,
              url: item.owner.url,
            },
          };
        }
      })
      .slice(0, limit);

    const pages: Result[][] = split(items, 10);
    let index = 0;
    const desc = getDesc(pages, index);
    const embed = new MessageEmbed()
      .setDescription(`**Results**\n\n${desc}`)
      .setFooter(`Page ${index + 1} of ${pages.length}`);
    const buttonActionRow = new MessageActionRow({
      type: "ACTION_ROW",
      components: [
        new MessageButton({
          style: "PRIMARY",
          customId: "prevsearch",
          label: "Prev",
        }),
        new MessageButton({
          style: "SUCCESS",
          customId: "nextsearch",
          label: "Next",
        }),
      ],
    });

    const message = (await interaction.editReply({
      embeds: [embed],
      components: [buttonActionRow],
    })) as Message;
    const collector = channel.createMessageComponentCollector({
      componentType: "BUTTON",
    });
    collector.on("collect", (interaction) => {
      if (interaction.customId === "prevsearch") {
        index = index - 1 < 0 ? 0 : index - 1;
        const description = getDesc(pages, index);
        message.edit({
          embeds: [
            embed
              .setDescription(`**Results**\n\n${description}`)
              .setFooter(`page ${index + 1} of ${pages.length}`),
          ],
        });
        return;
      }

      if (interaction.customId === "search") {
        index = index + 1 >= pages.length ? pages.length - 1 : index + 1;
        const description = getDesc(pages, index);
        message.edit({
          embeds: [
            embed
              .setDescription(`**Results**\n\n${description}`)
              .setFooter(`page ${index + 1} of ${pages.length}`),
          ],
        });
        return;
      }
    });
  },
};
