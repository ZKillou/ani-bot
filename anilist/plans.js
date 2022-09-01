const fetch = require("node-fetch")
const Canvas = require("canvas")
Canvas.registerFont("./font/Ubuntu.ttf", { family: "ubuntu" });
const { AttachmentBuilder } = require("discord.js")
const moment = require("moment")
moment.locale("fr")
const { resolveSeason, resolveFormat, resolveStatus } = require("./resolver")
const defaultUserName = process.env.USERNAME

const getPlansListQuery = `
query getPlansList($userName: String) {
	MediaListCollection(userName: $userName, type: ANIME, status: PLANNING) {
		lists {
			entries {
				media {
					title {
						english
						romaji
					}
					format
					status
					season
					seasonYear
					episodes
					duration
					coverImage {
						medium
						color
					}
					nextAiringEpisode {
						airingAt
						episode
					}
				}
			}
		}
	}
}
`

module.exports = {
	getPlansList: async (userName) => {
		if(!userName) userName = defaultUserName
		const response = await fetch("https://graphql.anilist.co/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({ query: getPlansListQuery, variables: { userName } })
		})
		
		const body = await response.json()
		if(!response.ok) return null
		return body.data.MediaListCollection.lists[0].entries
	},
	
	generatePlansListCanvas: async (data) => {
		let x = 20
		let y = 10
		let width = 200
		let height = 282
		let radius = 20
		let widthRect = 2000
		
		const canvas = Canvas.createCanvas(widthRect + (x * 2), 20 + data.length * (height + 10))
		const ctx = canvas.getContext("2d")
		
		for(let i = 0; i < data.length; i++){
			const cover = await Canvas.loadImage(data[i].media.coverImage.medium)
			let lastY = y
			
			let status = ""
			switch(data[i].media.status){
				case "FINISHED":
					status = "#0068FF"
					break
				case "RELEASING":
					status = "#2DDA00"
					break
				case "NOT_YET_RELEASED":
				case "CANCELLED":
				default:
					status = "#FF0400"
					break
			}
			
			// Dessine le rectangle
			ctx.fillStyle = "#181818"
			ctx.beginPath()
			ctx.moveTo(x + radius, y)
			ctx.lineTo(x + widthRect - radius, y)
			ctx.quadraticCurveTo(x + widthRect, y, x + widthRect, y + radius)
			ctx.lineTo(x + widthRect, y + height - radius)
			ctx.quadraticCurveTo(x + widthRect, y + height, x + widthRect - radius, y + height)
			ctx.lineTo(x + radius, y + height)
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
			ctx.lineTo(x, y + radius)
			ctx.quadraticCurveTo(x, y, x + radius, y)
			ctx.closePath()
			ctx.fill()
			
			// Dessine l'image
			ctx.save()
			ctx.beginPath()
			ctx.moveTo(x + radius, y)
			ctx.lineTo(x + width - radius, y)
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
			ctx.lineTo(x + width, y + height - radius)
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
			ctx.lineTo(x + radius, y + height)
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
			ctx.lineTo(x, y + radius)
			ctx.quadraticCurveTo(x, y, x + radius, y)
			ctx.closePath()
			ctx.clip()
			ctx.drawImage(cover, x, y, width, height)
			ctx.restore()
			
			// Defaults
			let metrics = null
			let txt = ""
			let ro = true
			
			// Dessine le titre
			ctx.fillStyle = data[i].media.coverImage.color
			ctx.font = "60px 'ubuntu'"
			ctx.textAlign = "center"
			ctx.textBaseline = 'middle'
			if(!data[i].media.title.english) {
				txt = data[i].media.title.romaji
				ro = false
			} else txt = data[i].media.title.english
			lastY += 45 + printAtWordWrap(ctx, txt, x + ((widthRect - width) / 2) + width, y + 45, 10, widthRect - width)
			
			ctx.fillStyle = "#FFFFFF"
			ctx.font = "40px 'ubuntu'"
			if(ro) {
				txt = data[i].media.title.romaji
				lastY += printAtWordWrap(ctx, txt, x + ((widthRect - width) / 2) + width, lastY, 10, widthRect - width)
			}
			
			// Dessine les infos complémentaires
			txt = `${data[i].media.season ? `${resolveSeason(data[i].media.season)} ${data[i].media.seasonYear} • ` : ""}${resolveFormat(data[i].media.format)}${data[i].media.duration ? ` (${data[i].media.duration} min)` : ""}${data[i].media.episodes ? ` • ${data[i].media.episodes} épisode${data[i].media.episodes == 1 ? "" : "s"}` : ""}`
			ctx.fillText(txt, x + ((widthRect - width) / 2) + width, lastY + 15)
			metrics = ctx.measureText(txt)
			lastY += 15 + metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
			
			// Dessine le status de l'anime
			ctx.fillStyle = status
			txt = data[i].media.nextAiringEpisode ? `Épisode ${data[i].media.nextAiringEpisode.episode} le ${moment(new Date(data[i].media.nextAiringEpisode.airingAt * 1000).toISOString()).format("ddd DD MMM YYYY à LT")}` : resolveStatus(data[i].media.status)
			ctx.fillText(txt, x + ((widthRect - width) / 2) + width, lastY + 25)
			metrics = ctx.measureText(txt)
			lastY += 25 + metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
			
			// Augmente les valeurs
			y += height + 10
		}
		
		return new AttachmentBuilder(canvas.toBuffer(), { name: "feur2.png" })
	}
}

function printAtWordWrap(context, text, x, y, lineHeight, fitWidth) {
	let length = 0
    fitWidth = fitWidth || 0;
    
    if (fitWidth <= 0) {
        context.fillText(text, x, y);
        let metrics = context.measureText(text)
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    }
    let words = text.split(' ');
    let currentLine = 0;
    let idx = 1;
    while (words.length > 0 && idx <= words.length) {
        let str = words.slice(0,idx).join(' ');
        let w = context.measureText(str).width;
        if (w > fitWidth) {
            if (idx==1) {
                idx=2;
            }
            let txt = words.slice(0, idx - 1).join(' ')
            context.fillText(txt, x, y + length);
            let metrics = context.measureText(txt)
            length += metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + lineHeight
            currentLine++;
            words = words.splice(idx - 1);
            idx = 1;
        } else idx++
    }
    if (idx > 0) {
    	let txt = words.join(' ')
    	context.fillText(txt, x, y + length);
	    let metrics = context.measureText(txt)
		length += metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + lineHeight
    }
    return length
}