import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import {
  InteractionCollector,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageEmbed,
} from "discord.js";
import { promisify } from "util";
import { getInfo, videoInfo } from "ytdl-core";
import { ComponentCollector } from "../ComponentCollector";
import { Track } from "./Track";

const wait = promisify(setTimeout);
const split = (arr, size: number) => {
  const res = [];
  while (arr.length > 0) {
    const chunk = arr.splice(0, size);
    res.push(chunk);
  }
  return res;
};

const time = (second: number) => {
  const min = Math.floor(second / 60);
  const sec = second % 60;
  return { min, sec: ("0" + sec).slice(-2) };
};


export class MusicSubscription {
  public readonly voiceConnection: VoiceConnection;
  public readonly audioPlayer: AudioPlayer;
  public queue: Track[];
  public queueMessage: Message;
  public playlist: Track[];
  public playlistPage: number;
  public playlistEmbed: MessageEmbed;
  public playlistActionRow: MessageActionRow;
  public playlistCache: {};
  public queueLock = false;
  public readyLock = false;
  public volume: number;
  public playerEmbed: MessageEmbed;
  public playerActionRow: MessageActionRow;
  public message: Message;
  public collector: ComponentCollector;


  public constructor(voiceConnection: VoiceConnection) {
    this.queue = [];
    this.playlist = [];
    this.audioPlayer = createAudioPlayer();
    this.voiceConnection = voiceConnection;
    this.volume = 10;
    this.playlistPage = 0;
    this.playlistEmbed = new MessageEmbed({
      color: "GREEN",
    });
    this.playlistActionRow = new MessageActionRow({
      type: "ACTION_ROW",
      components: [
        new MessageButton({
          style: "PRIMARY",
          customId: "firstplaylist",
          label: "First",
        }),
        new MessageButton({
          style: "PRIMARY",
          customId: "prevplaylist",
          label: "Prev",
        }),
        new MessageButton({
          style: "PRIMARY",
          customId: "nextplaylist",
          label: "Next",
        }),
        new MessageButton({
          style: "PRIMARY",
          customId: "lastplaylist",
          label: "Last",
        }),
        new MessageButton({
          style: "PRIMARY",
          customId: "player",
          label: "Player",
        }),
      ],
    });

    this.voiceConnection.on("stateChange", async (oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          await entersState(
            this.voiceConnection,
            VoiceConnectionStatus.Connecting,
            5_000
          ).catch((err) => this.voiceConnection.destroy());
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
          this.voiceConnection.rejoin();
        } else {
          this.voiceConnection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.stop();
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting ||
          newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true;
        await entersState(
          this.voiceConnection,
          VoiceConnectionStatus.Ready,
          20_000
        )
          .catch((err) => {
            if (
              this.voiceConnection.state.status !==
              VoiceConnectionStatus.Destroyed
            )
              this.voiceConnection.destroy();
          })
          .finally(() => (this.readyLock = false));
      }
    });

    this.audioPlayer.on("stateChange", (oldState, newState) => {
      if (
        // Finish playing
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        (oldState.resource as AudioResource<Track>).metadata.onFinish();
        void this.processQueue();
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // Entered playing status
        setTimeout(
          () => (newState.resource as AudioResource<Track>).metadata.onStart(),
          0
        );
      }
    });

    this.audioPlayer.on("error", (error) =>
      (error.resource as AudioResource<Track>).metadata.onError(error)
    );

    voiceConnection.subscribe(this.audioPlayer);
  }

  public stop() {
    this.queueLock = true;
    this.queue = [];
    this.playlist = [];
    this.audioPlayer.stop(true);
    this.voiceConnection.disconnect();
  }

  public skip() {
    this.audioPlayer.stop();
  }

  public async play() {
    // console.log(this.queue);
    this.queueLock = false;
    await this.processQueue();
  }

  public enqueue(track: Track) {
    this.queue.push(track);
    this.playlist.push(track);
  }

  public setVolume(volume: number) {
    this.volume = volume;
  }

  private async processQueue(): Promise<void> {
    if (
      this.queueLock ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
      this.queue.length === 0
    )
      return;

    this.queueLock = true;
    const nextTrack = this.queue.shift();
    try {
      const resource = await nextTrack.createAudioResource();
      resource.volume.setVolume(this.volume / 100);
      this.audioPlayer.play(resource);
      this.queueLock = false;
    } catch (error) {
      console.warn(error);
      nextTrack.onError(error as Error);
      this.queueLock = false;
      return this.processQueue();
    }
  }

  public getDesc = async (subscription: MusicSubscription, index: number) => {
    const playlist = await Promise.all(
      subscription.playlist.map(async (track, index) => {
        const idx = (index + 1)
          .toString()
          .padStart(2, "\u2005")
          .padEnd(4, "\u2005");
        const title = `[${track.title.slice(0, 70)}](${track.url})`;
        let output = `${idx}${title}`;
        if (
          subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle &&
          track === subscription.audioPlayer.state.resource.metadata
        )
          output = `__**${output}**__`;
        return output;
      })
    );
    const pages: string[][] = split(playlist, 10);
    if (subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
      const current = subscription.audioPlayer.state
        .resource as AudioResource<Track>;
      const info = await getInfo(current.metadata.url);
      const duration = Math.round(current.playbackDuration / 1000);
      const length = Number.parseInt(info.videoDetails.lengthSeconds);
      const queueNum = subscription.playlist.indexOf(current.metadata);

      return `**Now Playing** [${current.metadata.title}](${
        current.metadata.url
      }) ${time(duration).min}:${time(duration).sec} / ${time(length).min}:${
        time(length).sec
      } - **#${queueNum + 1}** \n\n${pages[index].join("\n")}`;
    }

    return `**Idling**\n\n${pages[index].join("\n")}`;
  };
}
