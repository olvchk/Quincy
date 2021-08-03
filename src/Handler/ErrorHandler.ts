import { Command } from "../Interfaces";
import { GuildMember, Interaction, Message, Permissions } from "discord.js";
import Client from "../Client"

interface ErrorInterace {
  client: Client;
  command: Command;
  message?: Message;
  interaction?: Interaction;
  args: string[]
}
export const ErrorHandler = ({client, command, message=undefined, interaction=undefined, args}: ErrorInterace): string => {
  const { guild } = message ?? interaction;
  const { member } = message ?? interaction;
  const { user } = member;

  if (
    command.testOnly &&
    client.testGuilds &&
    !client.testGuilds.has(guild.id)
  ) return "This command only available for specified test guilds!";

  if (
    command.ownerOnly &&
    !client.owners.includes(user.id)
  ) return "You are not the owner of this bot!"

  
  if (message) {

    if (
      command.slash &&
      typeof command.slash != 'string'
    ) return "This command can only be accessed by slash command"
    
    if (
      !guild &&
      command.guildOnly
    ) return "This command only available on server!"
  
    if (
      command.minArgs < 0 ||
      command.maxArgs < 0 ||
      command.minArgs > command.maxArgs 
    ) return "Invalid argument(s) limit";
    
    if(command.expectedArgs) {
      const split = command.expectedArgs
        .substring(1, command.expectedArgs.length - 1)
        .split(/[>\]] [<\[]/)

      if (split.length > command.maxArgs) 
        return "Expected argument(s) size is higher than expected arguments limit";
    }
    
    if (
      args.length < command.minArgs ||
      args.length > command.maxArgs
    ) return "Invalid argument(s) passed!"

  }

  if (interaction) {

    if (
      !command.slash &&
      typeof command.slash != 'string'
    ) return "This command cannot be accessed by slash command!"

  } 

  return null;
}
