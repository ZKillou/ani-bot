const fetch = require("node-fetch")
const { ActionRowBuilder, EmbedBuilder, SelectMenuBuilder, SelectMenuOptionBuilder } = require("discord.js")
const moment = require("moment")
moment.locale("fr")
const { resolveSeason, resolveFormat, resolveStatus, resolveSource, resolveRelation } = require("./resolver")

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
			format
			status (version: 2)
			description (asHtml: false)
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
				episode
			}
			countryOfOrigin
			source (version: 3)
			averageScore
			popularity
			favourites
			relations {
				edges {
					node {
						title {
							english
							romaji
						}
					}
					relationType
				}
			}
			characters {
				edges {
					node {
						name {
							full
						}
					}
					role
					name
					voiceActors (language: JAPANESE) {
						name {
							full
						}
						siteUrl
					}
				}
			}
			staff {
				edges {
					node {
						name {
							full
						}
					}
					role
				}
			}
			studios {
				nodes {
					name
				}
			}
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
		console.log(body)
		if(!response.ok) return null
		return body.data.Page.media
	},
	
	loadCommand: async (message, msg, animes) => {
		let embedType = "info"
		let animeId = 0
		const collector = msg.createMessageComponentCollector({ filter: interaction => interaction.user.id == message.author.id, time: 600000 })
		await msg.edit({ content: null, components: generateRows(animes, 0, "info"), embeds: [generateEmbed(animes[0], "info")] })
		collector.on("collect", interaction => {
			if(interaction.customId == "scoobydoo"){
				animeId = parseInt(interaction.values[0])
				interaction.update({ content: null, components: generateRows(animes, animeId, embedType), embeds: [generateEmbed(animes[animeId], embedType)] })
			} else if(interaction.customId == "shaggy"){
				embedType = interaction.values[0]
				interaction.update({ content: null, components: generateRows(animes, animeId, embedType), embeds: [generateEmbed(animes[animeId], embedType)] })
			}
		})
	}
	
}

function generateEmbed(anime, type) {
	let e = new EmbedBuilder()
		.setColor(anime.coverImage.color)
		.setImage(anime.coverImage.extraLarge)
		.setTitle(anime.title.english ?? anime.title.romaji ?? anime.title.native)
		.setURL(anime.siteUrl)
		
	if(type == "info") return e
		.setDescription(anime.description.replaceAll("<br>", ""))
		.setFooter({ text: anime.genres.join(", ") })
		.addFields({
			name: "Titres",
			value: `> :flag_${anime.countryOfOrigin.toLowerCase()}: Natif : ${anime.title.native}\n${anime.title.english ? `> 🇺🇲 Anglais : ${anime.title.english}\n` : ""}${anime.title.romaji ? `> 🌍 Romaji : ${anime.title.romaji}\n` : ""}`,
			inline: true
		}, {
			name: "Dates",
			value: `${anime.season ? `> ❄ Saison : ${resolveSeason(anime.season)} ${anime.seasonYear}\n` : ""}${anime.startedAt ? `> Commencé le : ${moment(`${anime.startedAt.year}-${addZeros(anime.startedAt.month, 2)}-${addZeros(anime.startedAt.day, 2)}`).format("ddd DD MMM YYYY")}\n` : ""}${anime.startDate ? `> Commencé le : ${moment(`${anime.startDate.year}-${addZeros(anime.startDate.month, 2)}-${addZeros(anime.startDate.day, 2)}`).format("ddd DD MMM YYYY")}\n` : ""}${anime.endDate ? `> Fini le : ${moment(`${anime.endDate.year}-${addZeros(anime.endDate.month, 2)}-${addZeros(anime.endDate.day, 2)}`).format("ddd DD MMM YYYY")}\n` : ""}`,
			inline: true
		}, {
			name: "Épisodes",
			value: `> 🎞 Nombre d'épisode : ${anime.episodes ?? "?"}\n> 🕑 Durée : ${anime.duration} min\n> 🎬 Statut : ${resolveStatus(anime.status)}${anime.nextAiringEpisode ? `\n\n> 📺 Prochain épisode (${anime.nextAiringEpisode.episode}) : ${moment(new Date(anime.nextAiringEpisode.airingAt * 1000).toISOString()).format("ddd DD MMM YYYY à LT")}` : ""}`,
			inline: true
		}, {
			name: "Informations",
			value: `> 🖥 Format : ${resolveFormat(anime.format)}\n> ℹ Source : ${resolveSource(anime.source)}\n> 🎬 Studios : ${anime.studios.nodes.map(s => s.name).join(", ")}`,
			inline: true
		}, {
			name: "Statistiques",
			value: `> ⭐ Score : ${anime.averageScore ?? 0}%\n> ❤ Favoris : ${anime.favourites ?? 0}\n> 👥 Popularité : Dans la liste de ${anime.popularity ?? 0} membres`,
			inline: true
		})
	if(type == "rel") return e
		.setDescription(anime.relations && anime.relations.edges.length ? anime.relations.edges.map(a => `${a.node.title.english ? `> 🇺🇲 Nom anglais : ${a.node.title.english}\n` : ""}> 🌍 Nom en romaji : ${a.node.title.romaji}\n> 🔗 Lien : ${resolveRelation(a.relationType)}`).join("\n\n") : "")
	if(type == "chars") return e
		.setDescription(anime.characters.edges.map(c => `> 👤 Nom : ${c.name ?? c.node.name.full}\n> 🏷 Role : ${c.role}\n> 🗣 Doubleur JP : [${c.voiceActors[0].name.full}](${c.voiceActors[0].siteUrl})`).join("\n\n"))
	if(type == "staff") return e
		.setDescription(anime.staff.edges.map(s => `> 👤 Nom : ${s.node.name.full}\n> 🏷 Role : ${s.role}`).join("\n\n"))
	return null
}

function generateRows(animes, currentAnime, currentAnimeData) {
	let animesData = animes.map((a, i) => {
		let o = new SelectMenuOptionBuilder()
			.setDefault(i == currentAnime)
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
	
	let animeData = [
		new SelectMenuOptionBuilder()
			.setValue("info")
			.setLabel("Informations")
			.setEmoji("ℹ")
			.setDefault(currentAnimeData == "info"),
		new SelectMenuOptionBuilder()
			.setValue("chars")
			.setLabel("Personnages")
			.setEmoji("👥")
			.setDefault(currentAnimeData == "chars"),
		new SelectMenuOptionBuilder()
			.setValue("staff")
			.setLabel("Staff")
			.setEmoji("🎬")
			.setDefault(currentAnimeData == "staff")
	]
	
	if(animes[currentAnime].relations && animes[currentAnime].relations.edges.length) animeData.push(new SelectMenuOptionBuilder()
		.setValue("rel")
		.setLabel("Relations")
		.setEmoji("🔗")
		.setDefault(currentAnimeData == "rel"))
	
	return [
		new ActionRowBuilder()
			.setComponents(
				new SelectMenuBuilder()
					.setCustomId("scoobydoo")
					.setMinValues(1)
					.setMaxValues(1)
					.setOptions(...animesData)
			),
		new ActionRowBuilder()
			.setComponents(
				new SelectMenuBuilder()
					.setCustomId("shaggy")
					.setMinValues(1)
					.setMaxValues(1)
					.setOptions(...animeData)
			)
	]
	
}

function addZeros(value, zeros){
	value = `${value}`
	for(let i = value.length; i < zeros; i++) value = `0${value}`
	return value
}