import {
  TextChannel,
  DMChannel,
  NewsChannel,
  PartialDMChannel,
  ThreadChannel,
  InteractionCollector,
  MessageComponentInteraction,
  Collection,
  InteractionCollectorOptions,
  MessageCollectorOptions,
} from "discord.js";

interface collect {
  (interaction: MessageComponentInteraction);
}
interface dispose {
  (interaction: MessageComponentInteraction);
}
interface end {
  (collected: Collection<any, MessageComponentInteraction>);
}

export class ComponentCollector {
  collector?: InteractionCollector<MessageComponentInteraction>;
  constructor(
    channel:
      | TextChannel
      | DMChannel
      | NewsChannel
      | PartialDMChannel
      | ThreadChannel,
    {
      options,
      collect,
      dispose,
      end,
    }: {
      options?: InteractionCollectorOptions<MessageComponentInteraction>;
      collect?: collect;
      dispose?: dispose;
      end?: end;
    }
  ) {
    this.collector = channel.createMessageComponentCollector(options);
    if (collect)
      this.collector.on("collect", (interaction) => collect(interaction));
    if (dispose)
      this.collector.on("dispose", (interaction) => dispose(interaction));
    if (end) this.collector.on("end", (collected) => end(collected));
  }
}
