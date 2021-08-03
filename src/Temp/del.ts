import { CommandInterface } from "../Interfaces";

export const command: CommandInterface = {
   name: 'del',
   run: ({client, message, args}) => {
      if (args.includes('client')) {
         client.application.commands.fetch().then(commands => {
            console.log('Client:')
            commands.forEach(async cmd => {
               console.log(`Deleting ${cmd.name}`);
               await cmd.delete()
            })
         })
         return;
      }

      message.guild.commands.fetch().then(commands => {
         console.log('Guild:')
         commands.forEach(async cmd => {
            console.log(`Deleting ${cmd.name}`);
            await cmd.delete()
         })
      })
   }
}