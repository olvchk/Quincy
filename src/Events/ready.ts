import { Event } from "../Interfaces"

export const event: Event = {
  name: 'ready',
  run: async (client) => {
    await client.utils();
    console.log(`${client.user.tag} is now online!`)
  }
}