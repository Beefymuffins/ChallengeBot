const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const BaseSlashCommand = require('../utils/BaseSlashCommand');
const Challenge = require('../schemas/challenge');
const User = require('../schemas/user');

module.exports = class LeaderboardSlashCommand extends BaseSlashCommand {
  constructor() {
    super('leaderboard');
  }

  async run(client, interaction) {
    const embed = new EmbedBuilder()
      .setColor('Greyple')
      .setTitle('SOL Challenge - Leaderboard 🏆 ')
      .setFooter({
        text: 'Powered By - Creations',
        iconURL:
          'https://cdn.dribbble.com/users/3982610/screenshots/7187606/media/8d1efc16ecede0f9923a51f583b3f270.png?compress=1&resize=200x200',
      });

    // Get game ID from user who is calling command then find all users of that game
    const userInfo = await User.findOne({ userId: interaction.user.id });
    const challengeId = await Challenge.findOne({ _id: userInfo.gameId })
      .populate('players', 'userName -_id currentBalance')
      .select('players currentBalance');

    const playersInChallenge = challengeId.players;

    if (!playersInChallenge)
      return interaction.reply('Sorry, no leaderboard data to display!');

    try {
      // Create empty Array
      const sortArray = [];

      // Fill array
      for (const key in playersInChallenge) {
        sortArray.push({ key, currentBalance: playersInChallenge[key].currentBalance });
      }

      // Now sort it:
      sortArray.sort((x, y) => y.currentBalance - x.currentBalance).splice(5);

      // Now process that object within it:
      let players = '';
      let balances = '';
      for (let i = 0; i < sortArray.length; i++) {
        // Now do stuff with each player
        const player = playersInChallenge[sortArray[i].key];
        players += `\`${i + 1}\` ${player.userName}\n`;
        balances += `\`${player.currentBalance}\` ◎\n`;
      }

      embed.addFields([
        { name: 'Top 10', value: players, inline: true },
        { name: 'Balance', value: `${balances}`, inline: true },
      ]);
    } catch (error) {
      console.log('Error:', error);
    }

    await interaction.reply({ embeds: [embed] });
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('leaderboard command')
      .toJSON();
  }
};
