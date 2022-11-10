const { SlashCommandBuilder, bold, EmbedBuilder, codeBlock } = require('discord.js');
const axios = require('axios');
const BaseSlashCommand = require('../../utils/BaseSlashCommand');

module.exports = class RateScraperSlashCommand extends BaseSlashCommand {
  constructor() {
    super('crypto-rate');
  }

  async run(client, interaction) {
    const coin = interaction.options.get('coin')?.value || 0; // .toLowerCase()

    if (coin) {
      // Get crypto price from coingecko API
      const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`
      );

      // Check if data exists
      if (!data[coin].usd) throw Error();

      const singlePriceEmbed = new EmbedBuilder()
        .setColor('Greyple')
        .setTitle('Current price of:')
        .addFields([
          {
            name: bold(`Coin`),
            value: codeBlock(`${coin}`),
            inline: true,
          },
          {
            name: bold(`Price`),
            value: codeBlock(`${data[coin].usd}`),
            inline: true,
          },
        ])
        .setFooter({
          text: 'Powered By - Creations',
          iconURL:
            'https://cdn.dribbble.com/users/3982610/screenshots/7187606/media/8d1efc16ecede0f9923a51f583b3f270.png?compress=1&resize=200x200',
        })
        .setTimestamp();

      await interaction.reply({ embeds: [singlePriceEmbed] });
    } else if (coin === 0) {
      // Get crypto price from coingecko API
      const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=solana%2Cbitcoin%2Cethereum&vs_currencies=usd`
      );

      const priceEmbed = new EmbedBuilder()
        .setColor('Greyple')
        .setTitle('Current price of:');

      priceEmbed.addFields([
        { name: bold(`Bitcoin`), value: codeBlock(`${data.bitcoin.usd}`), inline: false },
        {
          name: bold(`Ethereum`),
          value: codeBlock(`${data.ethereum.usd}`),
          inline: false,
        },
        { name: bold(`Solana`), value: codeBlock(`${data.solana.usd}`), inline: false },
      ]);
      await interaction.reply({ embeds: [priceEmbed] });
    }
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Get current rates of crypto coins')
      .addStringOption((option) =>
        option.setName('coin').setDescription('Coin to fetch price data from.')
      )
      .toJSON();
  }
};
