import { CommandInterface } from "../../Interfaces";

export const command: CommandInterface = {
  name: "get",
  descripton: "Test only!",
  testOnly: true,
  ownerOnly: true,
  run: async ({client, args, message}) => {
    console.log('ROLES:')
    message.guild.roles.cache.forEach(async role => console.log(`${role.name}: ||${role.id}||`)) 
    console.log('APP:\n');
    client.application.commands.cache.forEach(cmd => console.log(`${cmd.name} ${cmd.id}`));
    console.log('GUILD:\n');
    message.guild.commands.cache.forEach(cmd => console.log(`${cmd.name} ${cmd.id}`));
    client.application.commands.fetch().then(commands => {
      console.log('\nAPP FETCH:')
      commands.forEach(cmd => console.log(`${cmd.name} ${cmd.id}`))
    })
    message.guild.commands.fetch().then(commands => {
      console.log('\nGUILD FETCH:')
      commands.forEach(cmd => console.log(`${cmd.name} ${cmd.id}`))
    })
  }
}