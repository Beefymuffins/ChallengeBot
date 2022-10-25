/* eslint-disable no-shadow */
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  bold,
  EmbedBuilder,
  codeBlock,
} = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const BaseSlashCommand = require('../../utils/BaseSlashCommand');

module.exports = class LmnftScraperSlashCommand extends BaseSlashCommand {
  constructor() {
    super('lmnft-scraper');
  }

  async run(client, interaction) {
    try {
      const lmnftModal = new ModalBuilder()
        .setTitle('Fetch cmid from LMNFT')
        .setCustomId('scrapeUrlModal')
        .setComponents(
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setLabel('Lmnft Collection Url')
              .setCustomId('id')
              .setStyle(TextInputStyle.Short)
          )
        );
      await interaction.showModal(lmnftModal);

      // Wait for user to fill and submit modal
      const modalSubmitInteraction = await interaction
        .awaitModalSubmit({
          time: 60000,
          // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
          filter: (i) => i.user.id === interaction.user.id,
        })
        .catch((error) => {
          // Catch any Errors that are thrown (e.g. if the awaitModalSubmit times out after 60000 ms)
          console.error(error);
          return null;
        });

      const url = modalSubmitInteraction.fields.getTextInputValue('id');
      if (!url.startsWith('https://www.launchmynft.io/'))
        return modalSubmitInteraction.reply('Please supply a valid url!');

      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const data = JSON.parse($('#__NEXT_DATA__').text());
      const base = data.props.pageProps.collection;

      const embed = new EmbedBuilder()
        .setColor('Greyple')
        .setTitle(`${base.collectionName}`)
        .setDescription(`${base.description}`)
        .setFooter({
          text: 'Powered By - Creations',
          iconURL:
            'https://cdn.dribbble.com/users/3982610/screenshots/7187606/media/8d1efc16ecede0f9923a51f583b3f270.png?compress=1&resize=200x200',
        })
        .addFields([
          {
            name: bold(`Link:`),
            value: `${url}`,
            inline: false,
          },
          {
            name: bold(`CMID:`),
            value: codeBlock(`${base.newCandyMachineAccountId}`),
            inline: false,
          },
          {
            name: bold(`Minted:`),
            value: `${base.totalMints}`,
            inline: true,
          },
          {
            name: bold(`Supply:`),
            value: `${base.maxSupply}`,
            inline: true,
          },
          {
            name: bold(`Price:`),
            value: `${base.cost} ◎`,
            inline: true,
          },
        ]);

      await modalSubmitInteraction.reply({ embeds: [embed], components: [] });
    } catch (error) {
      console.error(error);
    }
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Get lmnft CandyMachine ID')
      .toJSON();
  }
};
