import {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  ApplicationCommandPermissionData,
  ButtonInteraction,
  CommandInteraction,
  SelectMenuInteraction,
} from "discord.js";
import ExtendedClient from "../Client";
import Client from "../Client";

interface RunInterface {
  client?: Client;
  interaction?: CommandInteraction;
  args?: any[];
}

export class SlashCommand implements ApplicationCommandData {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  defaultPermission?: boolean;
  permissions?: ApplicationCommandPermissionData[];
  test?: boolean;
  init?: (client: Client) => any;
  run: ({ client, args, interaction }: RunInterface) => any;
}
