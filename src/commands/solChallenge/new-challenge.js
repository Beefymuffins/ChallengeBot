const { SlashCommandBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../../schemas/user');
const Challenge = require('../../schemas/challenge');
const BaseSlashCommand = require('../../utils/BaseSlashCommand');

module.exports = class StartChallengeSlashCommand extends BaseSlashCommand {
  constructor() {
    super('new-challenge');
  }

  async run(client, interaction) {
    const user = interaction.user.tag;
    const startBalance = interaction.options.get('start').value;
    const endBalance = interaction.options.get('end').value;
    const duration = parseInt(interaction.options.get('duration')?.value) || 0;
    const date = new Date();
    const expiry = duration === 0 ? null : date.setMonth(date.getMonth() + duration);

    const newChallenge = await new Challenge({
      _id: mongoose.Types.ObjectId(),
      startBalance,
      endBalance,
      host: interaction.user.id,
      duration: expiry,
    });

    await newChallenge.save().catch(console.error);
    const uid = newChallenge._id.toHexString();

    // Add host to game upon creation
    const addUser = await new User({
      _id: mongoose.Types.ObjectId(),
      userId: interaction.user.id,
      userName: interaction.user.tag,
      gameId: uid,
      currentBalance: startBalance,
    });

    await addUser.save().catch(console.error);

    await Challenge.findByIdAndUpdate(uid, {
      $addToSet: { players: addUser },
    });

    if (duration === 0) {
      return interaction.reply({
        content: `Challenge started by \`${user}\`\nHere is your Challenge Id: \`${uid}\`\nStarting Balance: \`${startBalance}\` Sol\nEnding Balance: \`${endBalance}\` Sol `,
      });
    }
    return interaction.reply({
      content: `Challenge started by \`${user}\`\nHere is your Challenge Id: \`${uid}\`\nStarting Balance: \`${startBalance}\` Sol\nEnding Balance: \`${endBalance}\` Sol\nDuration: \`${duration}\` month `,
    });
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Starts new Challenge')
      .addIntegerOption((option) =>
        option
          .setName('start')
          .setDescription('Starting Balance for the Sol Challenge.')
          .setMinValue(0)
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName('end')
          .setDescription('Ending Balance for the Sol Challenge.')
          .setMinValue(1)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('duration')
          .setDescription('The duration of the challenge.')
          .addChoices(
            { name: 'one-month', value: '1' },
            { name: 'two-months', value: '2' },
            { name: 'three-months', value: '3' }
          )
      )
      .toJSON();
  }
};
