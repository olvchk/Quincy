import { MessageEmbed } from "discord.js";
import { CommandInterface } from "../../Interfaces";
import axios from "axios"
import cheerio from "cheerio"


export const command: CommandInterface = {
  name: 'webinar',
  aliases: ['sat', 'webinars'],
  descripton: 'Get webinar list from @pengabdisat!',
  run: ({message}) => {
    const embed = new MessageEmbed({
      title: "Pengabdi SAT",
      description: "Webinar fetched from @pengabdisat",
      url: "https://instagram.com/pengabdisat",
      color: 'DARK_BLUE',
      author: {
        name: 'Oiko',
        url: 'https://instagram.com/oliperc',
      }
    })

    axios.get("https://msha.ke/pengabdisat/")
      .then(response => {
        const data = response.data;
        const $ = cheerio.load(data);
        const urls = $(".look13-links__link")
        
        urls.toArray().forEach(url => {
          const link = url.attribs['href'];
          const title = url.firstChild['data'];
          embed.addField(title, link, true)
        })
      })
      .then(() => {
        embed.setTimestamp(message.createdTimestamp)
        message.channel.send({
          embeds: [embed]
        })
      })
      .catch(err => {
        console.error(err)
      })
  }
}