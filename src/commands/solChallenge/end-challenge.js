const {
  SlashCommandBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  ModalBuilder,
  TextInputStyle,
} = require('discord.js');
const Challenge = require('../../schemas/challenge');
const User = require('../../schemas/user');
const BaseSlashCommand = require('../../utils/BaseSlashCommand');

module.exports = class EndeChallengeSlashCommand extends BaseSlashCommand {
  constructor() {
    super('end-challenge');
  }

  async run(client, interaction) {
    const modal = new ModalBuilder()
      .setTitle('End Existing Challenge')
      .setCustomId('EndChallengeModal')
      .setComponents(
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Existing Challenge ID')
            .setCustomId('id')
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

    const hostGame = await Challenge.findOne({ host: interaction.user.id });

    if (modalSubmitInteraction) {
      if (hostGame && hostGame.host === interaction.user.id) {
        try {
          const challengeId = modalSubmitInteraction.fields.getTextInputValue('id');

          // End/Delete game
          await Challenge.findOneAndDelete({ _id: challengeId });

          // Delete all users of the game
          await User.deleteMany({ gameId: challengeId }).then(
            modalSubmitInteraction.reply({
              content: `Successfully ended the Challenge`,
              ephemeral: true,
            })
          );
        } catch (error) {
          modalSubmitInteraction.reply({
            content: `There was a problem leaving the Challenge!`,
            ephemeral: true,
          });
          console.log(error);
        }
      } else {
        modalSubmitInteraction.reply({
          content: `You have to be host of the challenge to be able to end it!`,
          ephemeral: true,
        });
      }
    }
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Ends existing Challenge')
      .toJSON();
  }
};
