import { client } from "../index";
import { AudioPlayerStatus, PlayerSubscription, StreamType, VoiceConnectionStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel } from "@discordjs/voice";
import { Guild, Message, TextChannel, VoiceBasedChannel } from "discord.js";
import { atcType } from "./search";
import { makeButton } from "../config/config";

export class Atc {
  guild: Guild;
  playing: boolean;
  message: Message | undefined;
  nowSubscription: PlayerSubscription | undefined;
  textChannel: TextChannel | undefined;
  voiceChannel: VoiceBasedChannel | undefined;
  atcData: atcType | undefined;

  constructor(guild: Guild) {
    this.guild = guild;
    this.playing = false;
    this.message = undefined;
    this.nowSubscription = undefined;
    this.textChannel = undefined;
    this.voiceChannel = undefined;
    this.atcData = undefined;
  }

  stop(data: { disConnect?: boolean; msgDelete?: boolean }) {
    this.playing = false;
    this.nowSubscription?.player.stop();
    if (data.disConnect) {
      this.nowSubscription?.connection.disconnect();
      this.nowSubscription?.connection.destroy();
    }
    if (data.msgDelete) this.message?.delete().catch(() => {});

    this.message = undefined;
    this.nowSubscription = undefined;
    this.textChannel = undefined;
    this.voiceChannel = undefined;
    this.atcData = undefined;
  }

  setVoiceChannel(voiceChannel: VoiceBasedChannel) {
    this.voiceChannel = voiceChannel;
  }

  setMsg(data: { pause?: boolean }) {
    if (!this.playing || !this.atcData || !this.message) return;
    this.message.edit({ embeds: [ client.mkembed({
      title: `${this.atcData.name}`,
      description: `code: ${this.atcData.code.toUpperCase()}`,
      url: `https://www.liveatc.net/hlisten.php?mount=${this.atcData.urlId}&icao=${this.atcData.code}`,
      footer: { text: `${data.pause ? "일시정지됨" : "재생중"}` }
    }) ], components: [ makeButton(!!data.pause, this.playing, true) ] });
  }

  async play(data: { atcData: atcType; textChannel: TextChannel; voiceChannel: VoiceBasedChannel; }) {
    this.playing = true;
    this.atcData = data.atcData;
    this.textChannel = data.textChannel;
    this.voiceChannel = data.voiceChannel;
    this.message?.delete().catch(() => {});

    this.message = await this.textChannel.send({ embeds: [ client.mkembed({
      title: `재생준비중...`
    }) ] }).catch(() => {
      return undefined;
    });
    
    this.nowSubscription?.player.stop();
    
    const resource = createAudioResource(this.atcData.url, { inlineVolume: true, inputType: StreamType.Arbitrary });
    resource.volume?.setVolume(0.7);

    const connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guild.id,
      adapterCreator: this.guild.voiceAdapterCreator,
    });
    connection.setMaxListeners(0);
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000).catch(() => {
        this.stop({ msgDelete: true });
        this.message?.edit({ embeds: [ client.mkembed({
          title: `재생시도중 오류발생 (2)`,
          color: "DarkRed"
        }) ] }).then(m => {
          client.msgdelete(m, 1);
          this.message = undefined;
        });
      });
    } catch {
      this.stop({ msgDelete: true });
      this.message?.edit({ embeds: [ client.mkembed({
        title: `재생시도중 오류발생 (3)`,
        color: "DarkRed"
      }) ] }).then(m => {
        client.msgdelete(m, 1);
        this.message = undefined;
      });
      return;
    }

    this.setMsg({});
    
    try {
      const Player = createAudioPlayer();
      Player.setMaxListeners(0)
      Player.play(resource);
      const subscription = connection.subscribe(Player);
      this.nowSubscription = subscription;
      
      Player.once('error', async () => {
        this.stop({ msgDelete: true });
        this.message?.edit({ embeds: [ client.mkembed({
          title: `재생중 오류발생 (1)`,
          color: "DarkRed"
        }) ] }).then(m => {
          client.msgdelete(m, 1);
          this.message = undefined;
        });
        return;
      });
    } catch {
      this.stop({ msgDelete: true });
      this.message?.edit({ embeds: [ client.mkembed({
        title: `재생중 오류발생 (2)`,
        color: "DarkRed"
      }) ] }).then(m => {
        client.msgdelete(m, 1);
        this.message = undefined;
      });
      return;
    }
  }

  pause() {
    if (!this.playing) return;
    if (this.nowSubscription?.player.state.status === AudioPlayerStatus.Playing) {
      this.nowSubscription.player.pause(true);
      this.setMsg({ pause: true });
      entersState(this.nowSubscription.connection, VoiceConnectionStatus.Ready, 30_000).catch(() => {});
    } else if (this.atcData && this.nowSubscription) {
      const resource = createAudioResource(this.atcData.url, { inlineVolume: true, inputType: StreamType.Arbitrary });
      resource.volume?.setVolume(0.7);
      this.nowSubscription.player.play(resource);
      this.setMsg({ pause: false });
    } else {
      this.nowSubscription?.player.unpause();
      this.setMsg({ pause: false });
    }
  }
}