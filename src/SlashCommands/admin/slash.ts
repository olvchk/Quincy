import {
  ApplicationCommandOptionData,
  CommandInteraction,
  Guild,
} from "discord.js";
import ExtendedClient from "../../Client";
import { SlashCommand } from "../../Interfaces";

const getCommands = async (
  query: "global" | "guild",
  {
    guild,
    client,
  }: {
    client?: ExtendedClient;
    guild?: Guild;
  }
) => {
  if (query === "guild") {
    const commands = await guild.commands.fetch();
    let output = "guild:\n";
    commands.map((command) => {
      output += `${command.name} ||${command.id}||\n`;
    });
    return output;
  }

  if (query === "global") {
    const commands = await client.application.commands.fetch();
    let output = "global:\n";
    commands.map((command) => {
      output += `${command.name} ||${command.id}||\n`;
    });
    return output;
  }
};
const deleteCommands = async (
  query: "global" | "guild",
  slashId: `${bigint}`,
  { client, guild }: { client?: ExtendedClient; guild?: Guild }
) => {
  if (query === "guild") {
    const commands = await guild.commands.fetch();
    let output = "guild:\n";

    if (slashId) {
      const cmd = commands.get(slashId);
      output += `delete ${command.name}\n`;
      cmd.delete();
    } else {
      commands.map(async (command) => {
        output += `delete ${command.name}\n`;
        await command.delete();
      });
    }
    return output;
  }

  if (query === "global") {
    const commands = await client.application.commands.fetch();
    let output = "global:\n";
    if (slashId) {
      const cmd = commands.get(slashId);
      output += `delete ${command.name}\n`;
      cmd.delete();
    } else {
      commands.map((command) => {
        output += `delete ${command.name}\n`;
      });
    }
    return output;
  }
};

const run = async ({
  client,
  args,
  interaction,
}: {
  client: ExtendedClient;
  args: string[];
  interaction: CommandInteraction;
}) => {
  const slashId: any = args.shift();

  if (interaction.options.getSubCommandGroup() === "get") {
    if (interaction.options.getSubCommand() === "guild") {
      return await interaction.editReply(
        await getCommands("guild", { guild: interaction.guild })
      );
    }

    if (interaction.options.getSubCommand() === "global") {
      return await interaction.editReply(
        await getCommands("global", { client })
      );
    }
  }
  if (interaction.options.getSubCommandGroup() === "delete") {
    if (interaction.options.getSubCommand() === "guild") {
      return await interaction.editReply(
        await deleteCommands("guild", slashId, { guild: interaction.guild })
      );
    }

    if (interaction.options.getSubCommand() === "global") {
      return await interaction.editReply(
        await deleteCommands("global", slashId, { client })
      );
    }
  }
};

const options: ApplicationCommandOptionData[] = [
  {
    name: "delete",
    description: "delete slash commands",
    type: "SUB_COMMAND_GROUP",
    options: [
      {
        name: "global",
        description: "global commands",
        type: "SUB_COMMAND",
        options: [
          {
            name: "id",
            description: "slash command id, empty to delete all",
            type: "STRING",
          },
        ],
      },
      {
        name: "guild",
        description: "guild commands",
        type: "SUB_COMMAND",
        options: [
          {
            name: "id",
            description: "slash command id, empty to delete all",
            type: "STRING",
          },
        ],
      },
    ],
  },
  {
    name: "get",
    description: "get slash commands",
    type: "SUB_COMMAND_GROUP",
    options: [
      {
        name: "global",
        description: "global slash commands",
        type: "SUB_COMMAND",
      },
      {
        name: "guild",
        description: "guild slash commands",
        type: "SUB_COMMAND",
      },
    ],
  },
];

export const command: SlashCommand = {
  name: "slash",
  description: "manage slash commands",
  options,
  defaultPermission: false,
  run,
};
