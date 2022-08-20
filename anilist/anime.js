const fetch = require("node-fetch")
const { ActionRowBuilder, EmbedBuilder, SelectMenuBuilder, SelectMenuOptionBuilder } = require("discord.js")
const moment = require("moment")
moment.locale("fr")

const numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
const getAnimeQuery = `
query getAnime($search: String) {
	Page (page: 1, perPage: 10) {
		media (search: $search, type: ANIME) {
			title {
				english
				romaji
				native
			}
			status
			startDate {
				year
				month
				day
			}
			endDate {
				year
				month
				day
			}
			season
			seasonYear
			episodes
			duration
			coverImage {
				extraLarge
				color
			}
			genres
			nextAiringEpisode {
				airingAt
				timeUntilAiring
				episode
			}
			countryOfOrigin
			averageScore
			popularity
			favourites
			siteUrl
		}
	}
}
`

module.exports = {
	getAnime: async (search) => {
		const response = await fetch("https://graphql.anilist.co/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({ query: getAnimeQuery, variables: { search } })
		})
		
		const body = await response.json()
		if(!response.ok) return null
		return body.data.Page.media
	},
	
	loadCommand: async (message, msg, animes) => {
		const collector = msg.createMessageComponentCollector({ filter: interaction => interaction.user.id == message.author.id, time: 600000 })
		await msg.edit({ content: null, components: [generateRow(animes, 0)], embeds: [generateEmbed(animes[0])] })
		collector.on("collect", interaction => {
			const anime = animes[parseInt(interaction.values[0])]
			interaction.update({ content: null, components: [generateRow(animes, parseInt(interaction.values[0]))], embeds: [generateEmbed(anime)] })
		})
	}
	
}

function generateEmbed(anime) {
	return new EmbedBuilder()
		.setColor(anime.coverImage.color)
		.setImage(anime.coverImage.extraLarge)
		.setTitle(anime.title.english ?? anime.title.romaji ?? anime.title.native)
		.setURL(anime.siteUrl)
		.setFooter({ text: anime.genres.join(", ") })
		.addFields({
			name: "Titres",
			value: `> :flag_${anime.countryOfOrigin.toLowerCase()}: Natif : ${anime.title.native}\n${anime.title.english ? `> 🇺🇲 Anglais : ${anime.title.english}\n` : ""}${anime.title.romaji ? `> 🌍 Romaji : ${anime.title.romaji}\n` : ""}`,
			inline: true
		}, {
			name: "Dates",
			value: `${anime.season ? `> ❄ Saison : ${anime.season} ${anime.seasonYear}\n` : ""}${anime.startedAt ? `> Commencé le : ${moment(`${anime.startedAt.year}-${addZeros(anime.startedAt.month, 2)}-${addZeros(anime.startedAt.day, 2)}`).format("ddd DD MMM YYYY")}\n` : ""}${anime.startDate ? `> Commencé le : ${moment(`${anime.startDate.year}-${addZeros(anime.startDate.month, 2)}-${addZeros(anime.startDate.day, 2)}`).format("ddd DD MMM YYYY")}\n` : ""}${anime.endDate ? `> Fini le : ${moment(`${anime.endDate.year}-${addZeros(anime.endDate.month, 2)}-${addZeros(anime.endDate.day, 2)}`).format("ddd DD MMM YYYY")}\n` : ""}`,
			inline: true
		}, {
			name: "Épisodes",
			value: `> 🎞 Nombre d'épisode : ${anime.episodes ?? "?"}\n> 🕑 Durée : ${anime.duration} min\n> 🎬 Statut : ${anime.status}${anime.nextAiringEpisode ? `\n\n> 📺 Prochain épisode (${anime.nextAiringEpisode.episode}) : ${moment(new Date(anime.nextAiringEpisode.airingAt * 1000).toISOString()).format("ddd DD MMM YYYY à LT")}` : ""}`,
			inline: true
		}, {
			name: "Statistiques",
			value: `> ⭐ Score : ${anime.averageScore ?? 0}%\n> ❤ Favoris : ${anime.favourites ?? 0}\n> 👥 Popularité : Dans la liste de ${anime.popularity ?? 0} membres`,
			inline: true
		})
}

function generateRow(animes, current) {
	let animeData = animes.map((a, i) => {
		let o = new SelectMenuOptionBuilder()
			.setDefault(i == current)
			.setValue(`${i}`)
			.setEmoji(numbers[i])
		
		let ro = true
		if(a.title.english) o.setLabel(a.title.english)
		else {
			o.setLabel(a.title.romaji)
			ro = false
		}
		if(ro) o.setDescription(a.title.romaji)
		
		return o
	})
	
	return new ActionRowBuilder()
		.setComponents(
			new SelectMenuBuilder()
				.setCustomId("scoobydoo")
				.setMinValues(1)
				.setMaxValues(1)
				.setOptions(...animeData)
		)
}

function addZeros(value, zeros){
	value = `${value}`
	for(let i = value.length; i < zeros; i++) value = `0${value}`
	return value
}