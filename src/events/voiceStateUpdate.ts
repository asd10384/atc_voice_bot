import { client } from "../index";
import { VoiceState } from "discord.js";

export const voiceStateUpdate = (oldState: VoiceState, newState: VoiceState) => {
  const atc = client.getAtc(oldState.guild);
  if (newState.member!.id === client.user!.id && !newState.channelId) {
    atc.stop({ msgDelete: true });
  } else if (oldState.channelId && atc.voiceChannel?.id && oldState.channelId === atc.voiceChannel?.id && oldState.channel?.members.filter(m => !m.user.bot).size === 0) {
    atc.stop({ disConnect: true, msgDelete: true });
  }
}