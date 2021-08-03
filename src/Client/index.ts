import {
  Client,
  ClientOptions,
  Collection,
  Guild,
  Snowflake,
} from "discord.js";
import {
  Command,
  Event,
  Config,
  SlashCommand,
  MusicSubscription,
} from "../Interfaces";
import { connect } from "mongoose";
import { table } from "table";
import { glob } from "glob";
import { promisify } from "util";

const globPromise = promisify(glob);

const ConfigJson = {
  token: process.env.TOKEN,
  prefix: process.env.PREFIX,
  mongoURI: process.env.MONGOURI,
};

interface CustomOptionsInterface {
  testGuilds?: `${bigint}`[] | `${bigint}`;
  owners?: string[] | string;
}

class ExtendedClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public slashCommands: Collection<string, SlashCommand> = new Collection();
  public events: Collection<string, Event> = new Collection();
  public aliases: Collection<string, Command> = new Collection();
  public testGuilds: Collection<string, Guild> = new Collection();
  public prefixes: Collection<string, string> = new Collection();
  public playlists: Collection<string, {}> = new Collection();
  public subscriptions = new Map<Snowflake, MusicSubscription>();
  public owners: string[];
  public config: Config = ConfigJson;
  public customOptions: CustomOptionsInterface;

  constructor(options: ClientOptions, customOptions?: CustomOptionsInterface) {
    super(options);
    this.login(this.config.token);

    this.customOptions = customOptions;
    this.init();
  }

  public async init() {
    // Events
    const eventFiles = await globPromise(`${process.cwd()}/src/Events/**/*.ts`);
    eventFiles.forEach(async (file) => {
      const { event } = await import(file);
      this.on(event.name, event.run.bind(null, this));
    });

    // Commands
    let commandData = [];
    const commandFiles = await globPromise(
      `${process.cwd()}/src/Commands/**/*.ts`
    );
    commandFiles.forEach((file) => {
      const cmd = require(file);
      const command = new Command(cmd.command);
      this.commands.set(command.name, cmd.command);
      commandData.push([command.name, "✅"]);
      if (command.aliases !== undefined) {
        if (command.aliases.length !== 0) {
          command.aliases.forEach((alias) => {
            this.aliases.set(alias, cmd.command);
          });
        }
      }
    });

    console.log(
      table(commandData, {
        header: {
          alignment: "center",
          content: "Commands List",
        },
      })
    );
  }

  public async utils() {
    let { testGuilds, owners } = this.customOptions;

    // Test guilds
    if (testGuilds) {
      if (typeof testGuilds === "string") testGuilds = [testGuilds];

      for (const testGuild of testGuilds) {
        const guild = this.guilds.cache.get(testGuild);
        if (!guild) {
          throw new Error("Invite bot to the specified test server!");
        }
        this.testGuilds.set(guild.id, guild);
      }
    }

    // Owner
    if (owners) {
      if (typeof owners === "string") owners = [owners];

      this.owners = owners;
    }

    // DB
    await connect(this.config.mongoURI, {
      keepAlive: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    // Command Initialization
    // this.commands.filter(command => !!command.init).forEach(async command => {
    //   if (await command.testOnly) {
    //     if (this.testGuilds.size != 0) {
    //       this.testGuilds.forEach(testGuild => command.init({
    //         client: this,
    //       }));
    //     } else console.log(`Can't initialize command "${command.name}"! No test guilds specified`)

    //   } else command.init({
    //     client: this,
    //   });
    // })

    // SlashCommands
    let slashData = [];
    const slashCommandFiles = await globPromise(
      `${process.cwd()}/src/SlashCommands/**/*.ts`
    );
    for await (const file of slashCommandFiles) {
      const { command } = await import(file);

      if (command.init) await command.init(this);

      this.slashCommands.set(command.name, command);
      slashData.push([command.name, "✅"]);

      const { name, description, options } = command;
      let { defaultPermission, permissions } = command;
      permissions = permissions ?? [];
      defaultPermission = defaultPermission ?? true;
      permissions = [
        ...permissions,
        {
          id: this.owners[0],
          type: "USER",
          permission: true,
        },
      ];

      let { test } = command;
      test = test ?? true;
      if (test) {
        if (this.testGuilds) {
          for (const [guildName, guild] of this.testGuilds) {
            guild.commands
              .create({ name, description, options })
              .then((cmd) => {
                if (!defaultPermission) {
                  permissions = [
                    ...permissions,
                    {
                      id: guild.id,
                      type: "ROLE",
                      permission: false,
                    },
                  ];
                }
                cmd.permissions.add({ permissions });
              });
          }
        } else
          throw "You don't have any test guilds. Please specify a test guild!";
      } else
        await this.application.commands.create({ name, description, options });
    }

    console.log(
      table(slashData, {
        header: {
          wrapWord: true,
          alignment: "center",
          content: "Slash Command List",
        },
      })
    );

    // Bot presence
    this.user.setPresence({
      activities: [
        {
          name: `${this.config.prefix}help`,
          type: "PLAYING",
        },
        {
          name: "Chilling",
          type: "LISTENING",
        },
      ],
    });
  }
}

export default ExtendedClient;
