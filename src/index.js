const { Client, GatewayIntentBits, Routes, Collection } = require('discord.js');
const { config } = require('dotenv');
config();
const chalk = require('chalk');
const { REST } = require('@discordjs/rest');
const { connect } = require('mongoose');
const { registerCommands } = require('./utils/registry');
const { APP_ID, GUILD_ID, BOT_TOKEN } = process.env;

// Create Client(bot) and set intents (intentions to use)to enable for this connection
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create API Connection
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

// Connect to db
connect(process.env.MONGODB_URL, {}).then(() =>
  console.log(chalk.green('[Database Status]: Connected.'))
);

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));

// Create slash command interaction event
client.on('interactionCreate', (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    const cmd = client.slashCommands.get(commandName);
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommandName = interaction.options.getSubcommand(false);

    // Handle subgroups/subcommands
    if (subcommandName) {
      if (subcommandGroup) {
        const subcommandInstance = client.slashSubcommands.get(commandName);
        subcommandInstance.groupCommands
          .get(subcommandGroup)
          .get(subcommandName)
          .run(client, interaction);
      } else {
        const subcommandInstance = client.slashSubcommands.get(commandName);
        subcommandInstance.groupCommands.get(subcommandName).run(client, interaction);
      }
      return;
    }

    // Handle regular slash command
    if (cmd) {
      cmd.run(client, interaction);
    } else {
      interaction.reply({ content: 'This command has no run method' });
    }
  }
});

// Main function ran on startup
async function main() {
  try {
    client.slashCommands = new Collection();

    await registerCommands(client, '../commands');

    const slashCommandsJson = client.slashCommands.map((cmd) =>
      cmd.getSlashCommandJSON()
    );

    console.log('Started refreshing application Slash commands.');
    await rest.put(Routes.applicationGuildCommands(APP_ID, GUILD_ID), {
      body: [...slashCommandsJson],
    });

    const registeredSlashCommands = await rest.get(
      Routes.applicationGuildCommands(APP_ID, GUILD_ID)
    );
    // console.log('Registered Slash Commands!', registeredSlashCommands);

    // Login Bot After the Slash Commands are Registered
    await client.login(BOT_TOKEN);
  } catch (error) {
    console.error(error);
  }
}

main();
