import { CommandInterface } from "../../Interfaces";
import { MessageButton, MessageSelectMenu } from "discord.js";
import { MessageActionRow } from "discord.js";

export const command: CommandInterface = {
  name: "component",
  descripton: "Create components!",
  ownerOnly: true,
  testOnly: true,
  run: async ({ client, message, args }) => {
    const linkButton = new MessageButton({
      style: "LINK",
      label: "LINK",
      url: "https://www.instagram.com/oliperc",
    });
    const dangerButton = new MessageButton({
      style: "DANGER",
      customId: "DANGER1",
      label: "DANGER",
    });
    const primaryButton = new MessageButton({
      style: "PRIMARY",
      customId: "PRIMARY1",
      label: "PRIMARY",
    });
    const secondaryButton = new MessageButton({
      style: "SECONDARY",
      customId: "SECONDARY1",
      label: "SECONDARY",
    });
    const successButton = new MessageButton({
      style: "SUCCESS",
      customId: "SUCCESS1",
      label: "SUCCESS",
    });

    // Action row more like a container
    const buttonActionRow = new MessageActionRow({
      type: "ACTION_ROW",
      components: [
        linkButton,
        dangerButton,
        primaryButton,
        secondaryButton,
        successButton,
      ],
    });

    message.channel.send({
      content: "Action row",
      components: [buttonActionRow],
    });

    const selectMenu = new MessageSelectMenu({
      placeholder: "Select a number",
      customId: "SELECT_MENU_1",
      options: [
        {
          label: "Number 1",
          value: "aa",
          description: "Number 1 is the best choice of all time",
          emoji: "1️⃣",
        },
        {
          label: "Number 2",
          value: "2",
          description: "Choose number 2 instead number 1",
          emoji: "2️⃣",
        },
      ],
    });

    const menuActionRow = new MessageActionRow({
      type: "SELECT_MENU",
      components: [selectMenu],
    });

    message.channel.send({
      content: "Select menu",
      components: [menuActionRow],
    });
  },
};
