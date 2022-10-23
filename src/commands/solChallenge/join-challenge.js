const {
  SlashCommandBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  ModalBuilder,
  TextInputStyle,
} = require('discord.js');
const mongoose = require('mongoose');
const Challenge = require('../../schemas/challenge');
const user = require('../../schemas/user');
const User = require('../../schemas/user');
const BaseSlashCommand = require('../../utils/BaseSlashCommand');

module.exports = class JoinChallengeSlashCommand extends BaseSlashCommand {
  constructor() {
    super('join-challenge');
  }

  async run(client, interaction) {
    const modal = new ModalBuilder()
      .setTitle('Join Existing Sol')
      .setCustomId('registerUserModal')
      .setComponents(
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Existing Challenge ID')
            .setCustomId('id')
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Current Balance')
            .setCustomId('balance')
            .setStyle(TextInputStyle.Short)
        )
      );
    // Show the modal
    await interaction.showModal(modal);

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

    if (modalSubmitInteraction) {
      // 1. Get info from model
      const id = modalSubmitInteraction.fields.getTextInputValue('id');
      const balance = modalSubmitInteraction.fields.getTextInputValue('balance');
      const userInfo = await User.findOne({ userId: interaction.user.id });

      // Check the user is not already in the challenge
      if (userInfo.gameId === id)
        return modalSubmitInteraction.reply({
          content: 'Sorry, You are already in that challenge!',
          ephemeral: true,
        });

      try {
        // 2. Create new user and link to game ObjectID
        const newUser = new User({
          _id: mongoose.Types.ObjectId(),
          userId: interaction.user.id,
          userName: interaction.user.tag,
          gameId: id,
          currentBalance: balance,
        });

        await newUser.save().catch(console.error);

        // 3. Add player to the Challenge
        await Challenge.findByIdAndUpdate(id, {
          $addToSet: { players: newUser },
        }).then(
          modalSubmitInteraction.reply({
            content: `Successfully joined \`${id}\``,
            ephemeral: true,
          })
        );
      } catch (error) {
        modalSubmitInteraction.reply({
          content: `There was a problem joining the Challenge!`,
          ephemeral: true,
        });
        console.log(error);
      }
    }
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Joins existing Challenge')
      .toJSON();
  }
};
