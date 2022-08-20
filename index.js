require("dotenv").config()
const { Client } = require("discord.js")
const client = new Client({ intents: 33281 })
const { getWatchList, generateWatchListCanvas } = require("./anilist/watchlist")
const { getAnime, loadCommand } = require("./anilist/anime")

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`)
})

client.on("messageCreate", async message => {
	const args = message.content.split(/ +/gi)
	const commandName = args.shift()
	
	if(commandName == "!getlist"){
		const userName = args.join(" ")
		
		const animes = await getWatchList(userName)
		if(!animes) return message.reply({ content: "pov : le bot fonctionne pas" })
		const att = await generateWatchListCanvas(animes)
		message.reply({ files: [att] })
	} else if(commandName == "!getanime"){
		const search = args.join(" ")
		const msg = await message.reply({ content: "ça charge attend 2 sec" })
		const animes = await getAnime(search)
		if(!animes) return message.reply({ content: "pov : le bot fonctionne pas" })
		
		loadCommand(message, msg, animes)
	}
})

client.login(process.env.TOKEN)