import { Event, Command } from "../Interfaces"
import { ErrorHandler } from "../Handler/ErrorHandler";
import { Message } from "discord.js"

export const event: Event = {
  name: 'messageCreate',
  run: (client, message: Message) => {  
    const prefix = client.prefixes.get(message.guild.id) ?? client.config.prefix;
    
    if (
      message.author.bot ||
      !message.content.startsWith(prefix)
    ) return;
    
    const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
    

    const cmd = args.shift().toLowerCase();
    if(!cmd) return;

    
    let command: Command = client.commands.get(cmd) || client.aliases.get(cmd);
    if(command) {
      const error = ErrorHandler({client, command, message, args})
      if(error) {
        message.channel.send(error)
        return;
      }
      
      command.run({client, message, args})
    }
  }
}