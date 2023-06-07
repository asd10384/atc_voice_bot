import { client } from "../index";
import { Command } from "../interfaces/Command";
// import { Logger } from "../utils/Logger";
import { Message, EmbedBuilder, ApplicationCommandOptionType, ChatInputApplicationCommandData, CommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, GuildMember, ChannelType } from "discord.js";
import { search } from "../atc/search";

export default class implements Command {
  /** 해당 명령어 설명 */
  name = "play";
  visible = true;
  description = "play";
  information = "play";
  aliases: string[] = [];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description,
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: "code",
        description: "Airport/ARTCC Code",
        required: true
      }
    ]
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    const cmd = interaction.options.data[0];
    const data = cmd.options ? cmd.options[0]?.value : undefined;
    return await interaction.followUp(await this.search((data as string).toUpperCase()));
  }
  async messageRun(message: Message, args: string[]) {
    if (!args[0]) return message.channel.send({ embeds: [ client.mkembed({
      title: `${client.prefix}play [code]`,
      color: "DarkRed"
    }) ] }).then(m => client.msgdelete(m, 1));
    return message.channel.send(await this.search(args[0].toUpperCase())).then(m => client.msgdelete(m, 5));
  }
  async menuRun(interaction: StringSelectMenuInteraction, args: string[]) {
    if (!args[0] || args[0].startsWith("none")) return interaction.followUp({ embeds: [ client.mkembed({
      title: `현재 "DOWN"상태입니다.`,
      color: "DarkRed"
    }) ], ephemeral: true });
    const textChannel = interaction.message.channel;
    if (!textChannel || textChannel.type !== ChannelType.GuildText) return interaction.followUp({ embeds: [ client.mkembed({
      title: `채팅채널이 올바르지않습니다.`,
      color: "DarkRed"
    }) ], ephemeral: true });
    const voiceChannel = (interaction.member as GuildMember).voice.channel;
    if (!voiceChannel) return interaction.followUp({ embeds: [ client.mkembed({
      title: `음성채널에 들어간다음 사용해주세요.`,
      color: "DarkRed"
    }) ], ephemeral: true });
    const atc = client.getAtc(interaction.guild!);
    const [ url, code ] = args[0].split("#");
    const { list, err } = await search(code.toUpperCase());
    if (!list || err) return interaction.followUp({ embeds: [ client.mkembed({
      title: `현재 "DOWN"상태입니다.`,
      color: "DarkRed"
    }) ], ephemeral: true });
    const get = list.filter(v => v.url === url);
    if (get.length === 0) return interaction.followUp({ embeds: [ client.mkembed({
      title: `현재 "DOWN"상태입니다.`,
      color: "DarkRed"
    }) ], ephemeral: true });
    atc.play({ atcData: get[0], textChannel: textChannel, voiceChannel: voiceChannel });
    interaction.deferUpdate({ fetchReply: false }).catch(() => {});
    return;
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async search(code: string): Promise<{ embeds: EmbedBuilder[]; components?: ActionRowBuilder<StringSelectMenuBuilder>[]; }> {
    const { list, err } = await search(code);
    if (!list || err) return { embeds: [ client.mkembed({
      title: err,
      color: "DarkRed"
    }) ] };
    let cmdlist: { label: string, description: string, value: string }[] = list.map((v, i) => {
      return {
        label: `${i+1}번`,
        description: v.name,
        value: `${v.status ? v.url : "none"}#${code}`
      }
    });
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('play')
        .setPlaceholder('선택해주세요.')
        .addOptions(cmdlist)
    );
    return { embeds: [ client.mkembed({
      title: `검색: ${code}`,
      description: "하나를 선택해주세요."
    }) ], components: [ row ] };
  }
}