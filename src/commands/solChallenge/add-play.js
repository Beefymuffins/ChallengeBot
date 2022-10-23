const {
  SlashCommandBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  ModalBuilder,
  TextInputStyle,
  EmbedBuilder,
  bold,
  codeBlock,
} = require('discord.js');
const BaseSlashCommand = require('../../utils/BaseSlashCommand');
const percentage = require('../../utils/helpers.js');
const User = require('../../schemas/user');

module.exports = class AddPlayChallengeSlashCommand extends BaseSlashCommand {
  constructor() {
    super('add-play');
  }

  async run(client, interaction) {
    const modal = new ModalBuilder()
      .setTitle('Add+ Successful Play')
      .setCustomId('registerUserModal')
      .setComponents(
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Project Name')
            .setCustomId('project')
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Quantity')
            .setCustomId('quantity')
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Entry Price')
            .setCustomId('entry')
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Exit Price')
            .setCustomId('exit')
            .setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().setComponents(
          new TextInputBuilder()
            .setLabel('Creator Royalties %')
            .setCustomId('royalties')
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
      try {
        const entry = modalSubmitInteraction.fields.getTextInputValue('entry');
        const exit = modalSubmitInteraction.fields.getTextInputValue('exit');
        const quantity = modalSubmitInteraction.fields.getTextInputValue('quantity');
        const project = modalSubmitInteraction.fields.getTextInputValue('project');
        const royalties = modalSubmitInteraction.fields.getTextInputValue('royalties');
        // (Optional) Make platform fees dynamic to different selling platform fees ('2' is ME fee)

        const fees = percentage(parseInt(royalties) + 2, exit);
        const feesDecimals = (Math.round(fees * 10 ** 5) / 10 ** 5).toFixed(3); // the equation allows it to get around the point notation problem
        const netProfit = ((exit - entry - fees) * parseInt(quantity)).toFixed(3);
        const roi = ((netProfit / entry) * 100).toFixed(2);
        const balance = await User.findOne({ userId: interaction.user.id }); // TODO find all current games of user and update currentBalance
        const updatedB = balance.currentBalance + parseFloat(netProfit);

        // Update user balance in db
        await User.findOneAndUpdate(
          { userId: interaction.user.id },
          { currentBalance: updatedB }
        ).then(
          modalSubmitInteraction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor('Greyple')
                .setTitle('SOL Challenge - Success Tracker 📈')
                .setDescription(bold(`Project Name:\n ${quantity}x - ${project}`)) // [${project}](https://magiceden.io/marketplace/${project}) Option 2 (need slug, or slice and add '_')
                .setFooter({
                  text: 'Powered By - Creations',
                  iconURL:
                    'https://cdn.dribbble.com/users/3982610/screenshots/7187606/media/8d1efc16ecede0f9923a51f583b3f270.png?compress=1&resize=200x200',
                })
                .addFields([
                  {
                    name: bold(`Entry:`),
                    value: codeBlock(`${entry} SOL`),
                    inline: true,
                  },
                  {
                    name: bold(`Exit:`),
                    value: codeBlock(`${exit} SOL`),
                    inline: true,
                  },
                  {
                    name: bold(`Royalty + Platform Fees:`),
                    value: codeBlock(`-${feesDecimals} SOL`),
                    inline: false,
                  },
                  {
                    name: bold(`Net Profit:`),
                    value: codeBlock(`${netProfit} SOL`),
                    inline: false,
                  },
                  {
                    name: bold(`ROI:`),
                    value: `${roi}%`,
                    inline: true,
                  },
                  {
                    name: bold(`Your Balance:`),
                    value: `${updatedB.toFixed(2)} SOL`,
                    inline: true,
                  },
                ]),
            ],
          })
        );
      } catch (error) {
        modalSubmitInteraction.reply({
          content: `There was a problem adding the play to the Challenge!`,
          ephemeral: true,
        });
        console.log(error);
      }
    }
  }

  getSlashCommandJSON() {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Add Successful Play')
      .toJSON();
  }
};
