import Client from "../Client"
import { ApplicationCommandManager, Channel, Guild, GuildApplicationCommandManager, Interaction, Message } from "discord.js"

interface RunInterface {
  client?: Client | undefined,
  message?: Message | undefined,
  args?: string[] | undefined,
}
export interface Run {
  ({client, message, args}: RunInterface);
}

interface InitInterface {
  client?: Client,
}

export interface Init {
  ({client}: InitInterface);
}

export interface CommandInterface {
  name: string;
  descripton?: string;
  category?: string;
  aliases?: string[];
  permissions?: string[] | string;
  roles?: string[] | string;
  expectedArgs?: string;
  minArgs?: number;
  maxArgs?: number;
  testOnly?: boolean;
  guildOnly?: boolean;
  ownerOnly?: boolean;
  init?: Init;
  run: Run;
}

export class Command implements CommandInterface {
  name: string;
  descripton?: string;
  aliases?: string[];
  category?: string;
  permissions?: string[] | string;
  roles?: string[] | string;
  expectedArgs?: string;
  minArgs?: number;
  maxArgs?: number;
  testOnly?: boolean;
  guildOnly?: boolean;
  ownerOnly?: boolean;
  init?: Init;
  run: Run;
  
  constructor({
    name, 
    descripton, 
    category,
    aliases, 
    permissions,
    roles,
    expectedArgs, minArgs, maxArgs, 
    testOnly, guildOnly, ownerOnly,
    init, 
    run
  }: CommandInterface) {
    this.name = name;
    this.descripton = descripton;
    this.aliases = aliases ?? [''];
    this.category = category ?? undefined;
    this.permissions = typeof permissions === 'string' ? [permissions] : permissions ?? [];
    this.roles = typeof roles === 'string' ? [roles] : roles ?? [];
    this.minArgs = minArgs ?? 0;
    this.maxArgs = maxArgs ?? this.minArgs;
    this.expectedArgs = expectedArgs ?? '';
    this.testOnly = testOnly ?? false;
    this.guildOnly = guildOnly ?? true;
    this.ownerOnly = ownerOnly ?? false;
    this.init = init ?? null;
    this.run = run;
  }
  private createSlashCommand(): void {

  }
}