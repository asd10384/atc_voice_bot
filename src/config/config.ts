import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { ButtonStyle } from "discord.js";

export const makeButton = (color: boolean = true, play_pause: boolean = false, stop: boolean = true): ActionRowBuilder<ButtonBuilder> => new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("atc-play_pause")
    .setEmoji({ name: "⏯️" })
    .setStyle(color ? ButtonStyle.Primary : ButtonStyle.Success)
    .setDisabled(!play_pause)
).addComponents(
  new ButtonBuilder()
    .setCustomId("atc-stop")
    .setEmoji({ name: "⏹️" })
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!stop)
);