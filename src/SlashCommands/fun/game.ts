import { SlashCommand } from "../../Interfaces";
import fetch from "node-fetch"

export const command: SlashCommand = {
  name: 'game',
  description: 'play an application on a voice channel!',
  options: [{
    name: 'type',
    description: 'choose game you want to play',
    type: 'STRING',
    required: true,
    choices: [{
      name: 'youtube',
      value: '755600276941176913',
    }, {
      name: 'poker',
      value: '755827207812677713'
    }, {
      name: 'betrayal',
      value: '773336526917861400'
    }, {
      name: 'fishing',
      value: '814288819477020702'
    }, {
      name: 'chess',
      value: '832012586023256104'
    }]
  }, {
    name: 'id',
    description: 'voice channel id',
    required: true,
    type: 'CHANNEL'
  }],
  run: async ({client, args, interaction}) => {
    const { guild } = interaction;
    const [applicationID, channelID ]: any = args;
    const channel = guild.channels.cache.get(channelID);

    if ( channel.type != 'GUILD_VOICE') {
      interaction.editReply('Please choose a voice channel');
      return;
    }

    const data = {
      link: 'test'
    }

    try {
      await fetch(`https://discord.com/api/v8/channels/${channelID}/invites`, {
        method: 'POST',
        body: JSON.stringify({
            max_age: 86400,
            max_uses: 0,
            target_application_id: applicationID,
            target_type: 2,
            temporary: false,
            validate: null
        }),
        headers: {
            'Authorization': `Bot ${client.token}`,
            'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(invite => {
        if (invite.error || !invite.code)
          throw new Error('An error occured while retrieving data!');
        
        if (invite.code == '50013')
          console.warn('Your bot lacks permissions to perform that action');

        data['link'] = `https://discord.com/invite/${invite.code}`
      })
    } catch(err) {
      console.log(err);
    }
    
    interaction.followUp(data['link']);
  }
}