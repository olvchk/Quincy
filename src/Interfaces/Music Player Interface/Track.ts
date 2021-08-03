import {
  AudioResource,
  demuxProbe,
  createAudioResource,
} from "@discordjs/voice";
import { raw } from "youtube-dl-exec";
import { getInfo } from "ytdl-core";

export interface TrackData {
  url: string;
  title: string;
  onStart: () => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

const noop = () => {};

export class Track implements TrackData {
  public readonly url: string;
  public readonly title: string;
  public readonly onStart: () => void;
  public readonly onFinish: () => void;
  public readonly onError: (error: Error) => void;

  private constructor({ url, title, onStart, onFinish, onError }: TrackData) {
    this.url = url;
    this.title = title;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.onError = onError;
  }

  public createAudioResource(): Promise<AudioResource<Track>> {
    return new Promise((resolve, reject) => {
      const process = raw(
        this.url,
        {
          o: "-",
          q: "",
          f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
          r: "100K",
        },
        {
          stdio: ["ignore", "pipe", "ignore"],
        }
      );

      if (!process.stdout) {
        reject(new Error("No stdout"));
        return;
      }

      const stream = process.stdout;
      const onError = (error: Error) => {
        if (!process.killed) process.kill();
        stream.resume();
        reject(error);
      };

      process.once("spawn", () => {
        demuxProbe(stream)
          .then((probe) =>
            resolve(
              createAudioResource(probe.stream, {
                metadata: this,
                inputType: probe.type,
                inlineVolume: true,
              })
            )
          )
          .catch(onError);
      });
    });
  }

  public static async from(
    url: string,
    methods: Pick<Track, "onStart" | "onFinish" | "onError">
  ): Promise<Track> {
    const info = await getInfo(url).catch((error) => {
      throw error;
    });
    const title = info.videoDetails.title;
    console.log(`Queued ${title}`);
    const wrappedMethods = {
      onStart() {
        wrappedMethods.onStart = noop;
        methods.onStart();
      },
      onFinish() {
        wrappedMethods.onFinish = noop;
        methods.onFinish();
      },
      onError(error: Error) {
        wrappedMethods.onError = noop;
        methods.onError(error);
      },
    };

    return new Track({
      title: title,
      url,
      ...wrappedMethods,
    });
  }
}
