const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

// Token/client id
require("dotenv").config();
const token = process.env.DISNEY_TOKEN
const clientId = process.env.DISNEY_CLIENT_ID

const commands = [];
const command =
  new SlashCommandBuilder()
    .setName('character')
    .setDescription('Replies with a Disney character')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The Disney character\'s name to search for')
        .setRequired(false)
    );
commands.push(command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      // Routes.applicationGuildCommands(clientId, guildId), // For devlopment, register commands to guild immediately
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const axios = require('axios');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'character') { // Get a character slash commmand
    const charName = interaction.options.getString('name'); // Optional param to pass a disney characters name

    // It'll take us more than 3 seconds to make the api call, so defer the response
    await interaction.deferReply();

    if (charName !== null) { // Get a specific character
      character = await getCharacterByName(charName);

      if (character !== null) {
        embed = createEmbed(character);
      } else { // Couldn't find character embed
        embed =
          new MessageEmbed().setImage("https://www.kindpng.com/picc/m/681-6811770_thumb-image-mickey-mouse-shrugging-hd-png-download.png")
            .setTitle("Oops, couldn't find a character by the name '" + charName + "'")
            .addField("Pro-tip", "Make sure the capitalization and punctuation is correct for the character name you're searching for");
      }
    } else { // Get a random character
      character = await getRandomCharacter();
      embed = createEmbed(character);
    }

    // Reply with the character embed
    interaction.editReply({
      embeds: [embed],
      ephemeral: false
    });
  }
});

client.login(token);

function createEmbed(character) { // Add image and fields based on character obj
  const embed = new MessageEmbed().setImage(character.imageUrl).setTitle(character.name);

  character.films.forEach(element => {
    embed.addField('Appears in the movie', element);
  });
  character.tvShows.forEach(element => {
    embed.addField('Appears in the TV show', element);
  });
  character.allies.forEach(element => {
    embed.addField('Is allies with', element);
  });
  character.enemies.forEach(element => {
    embed.addField('Is enimes with', element);
  });

  return embed
}

function getRandomCharacter() {
  return new Promise(resolve => {
    axios.get("https://api.disneyapi.dev/characters").then((response) => { // Get all characters
      pages = response.data.totalPages; // Get how many pages there are of characters
      page = Math.floor(Math.random() * pages); // Pick a random page
      axios.get("https://api.disneyapi.dev/characters?page=" + page).then((response) => { // Call that page of characters
        characters = response.data.data;
        character = characters[Math.floor(Math.random() * (characters.length - 1))]; // Pick a random character out of the list we get back

        resolve(character);
      });
    });
  });
}

function getCharacterByName(name) {
  return new Promise(resolve => {
    // Use the GraphQL endpoint to pass a character name
    axios.get("https://api.disneyapi.dev/graphql?query={characterByName (name: \"" + name + "\") {name, films, tvShows, allies, enemies, imageUrl}}")
      .then((response) => {
        resolve(response.data.data.characterByName)
      });
  });
}