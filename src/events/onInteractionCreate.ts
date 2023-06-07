import { ButtonInteraction, Interaction } from "discord.js";
import { client, handler } from "..";

export const onInteractionCreate = async (interaction: Interaction) => {
  if (interaction.isStringSelectMenu()) {
    const commandName = interaction.customId;
    const args = interaction.values;
    const command = handler.commands.get(commandName);
    if (command && command.menuRun) return command.menuRun(interaction, args);
  }
  
  if (interaction.isButton()) {
    const args = interaction.customId.split("-");
    if (!args || args.length === 0) return;
    if (args[0] === "atc") {
      return Atc(interaction, args[1]);
    }
    await interaction.deferReply({ ephemeral: true, fetchReply: true });
    const command = handler.commands.get(args.shift()!);
    if (command && command.buttonRun) return command.buttonRun(interaction, args);
  }

  if (!interaction.isCommand()) return;

  /**
   * 명령어 친사람만 보이게 설정
   * ephemeral: true
   */
  await interaction.deferReply({ ephemeral: true, fetchReply: true });
  handler.runCommand(interaction);
}

async function Atc(interaction: ButtonInteraction, cmd: string) {
  const atc = client.getAtc(interaction.guild!);

  if (cmd === "play_pause") {
    if (atc.playing) atc.pause();
  }
  if (cmd === "stop") {
    atc.stop({ msgDelete: true });
  }
  interaction.deferUpdate({ fetchReply: false }).catch(() => {});
}
