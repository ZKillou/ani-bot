const fetch = require("node-fetch")
const Canvas = require("canvas")
Canvas.registerFont("./font/Ubuntu.ttf", { family: "ubuntu" });
const { AttachmentBuilder } = require("discord.js")
const moment = require("moment")
moment.locale("fr")
const { resolveSeason, resolveFormat } = require("./resolver")
const defaultUserName = process.env.USERNAME

const getWatchListQuery = `
query getWatchList($userName: String) {
	MediaListCollection(userName: $userName, type: ANIME, status: CURRENT) {
		lists {
			entries {
				progress
				score (format: POINT_10)
				startedAt {
					year
					month
					day
				}
				updatedAt
				media {
					title {
						english
						romaji
					}
					format
					season
					seasonYear
					episodes
					duration
					coverImage {
						large
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
	getWatchList: async (userName) => {
		if(!userName) userName = defaultUserName
		const response = await fetch("https://graphql.anilist.co/", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({ query: getWatchListQuery, variables: { userName } })
		})
		
		const body = await response.json()
		if(!response.ok) return null
		return body.data.MediaListCollection.lists[0].entries.sort((a,b) => (b.progress / b.media.episodes) - (a.progress / a.media.episodes))
	},
	
	generateWatchListCanvas: async (data) => {
		let x = 20
		let y = 10
		let width = 500
		let height = 705
		let radius = 20
		let widthRect = 1500
		
		const canvas = Canvas.createCanvas(widthRect + (x * 2), 20 + data.length * (height + 10))
		const ctx = canvas.getContext("2d")
		
		for(let i = 0; i < data.length; i++){
			const cover = await Canvas.loadImage(data[i].media.coverImage.large)
			let lastY = y
			
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
			
			// Dessine la saison
			txt = `${resolveSeason(data[i].media.season)} ${data[i].media.seasonYear} ??? ${resolveFormat(data[i].media.format)} (${data[i].media.duration} min)`
			ctx.fillText(txt, x + ((widthRect - width) / 2) + width, lastY + 15)
			metrics = ctx.measureText(txt)
			lastY += 15 + metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
			
			// USER RELATED
			lastY += 40
			
			txt = `??pisode : ${data[i].progress}/${data[i].media.episodes}`
			ctx.fillText(txt, x + ((widthRect - width) / 2) + width, lastY)
			metrics = ctx.measureText(txt)
			lastY += metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
			
			if(data[i].media.nextAiringEpisode) {
				txt = `??pisode ${data[i].media.nextAiringEpisode.episode} le ${moment(new Date(data[i].media.nextAiringEpisode.airingAt * 1000).toISOString()).format("ddd DD MMM YYYY ?? LT")}`
				ctx.fillText(txt, x + ((widthRect - width) / 2) + width, lastY + 15)
				metrics = ctx.measureText(txt)
				lastY += 15 + metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
			}
			
			txt = `Commenc?? le ${moment(`${data[i].startedAt.year}-${addZeros(data[i].startedAt.month, 2)}-${addZeros(data[i].startedAt.day, 2)}`).format("ddd DD MMM YYYY")}`
			ctx.fillText(txt, x + ((widthRect - width) / 2) + width, lastY + 15)
			metrics = ctx.measureText(txt)
			lastY += 15 + metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
			
			if(data[i].score) {
				ctx.fillStyle = data[i].media.coverImage.color
				drawStar(ctx, x + ((widthRect - width) / 2) + width + 25, lastY + 20, 5, 30, 15)
				ctx.fillText(data[i].score, x + ((widthRect - width) / 2) + width - 25, lastY + 20)
			}
			
			// Augmente les valeurs
			y += height + 10
		}
		
		return new AttachmentBuilder(canvas.toBuffer(), { name: "feur.png" })
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

function drawStar(ctx,cx,cy,spikes,outerRadius,innerRadius){
  let rot=Math.PI/2*3;
  let x=cx;
  let y=cy;
  let step=Math.PI/spikes;

  ctx.beginPath();
  ctx.moveTo(cx,cy-outerRadius)
  for(i=0;i<spikes;i++){
    x=cx+Math.cos(rot)*outerRadius;
    y=cy+Math.sin(rot)*outerRadius;
    ctx.lineTo(x,y)
    rot+=step

    x=cx+Math.cos(rot)*innerRadius;
    y=cy+Math.sin(rot)*innerRadius;
    ctx.lineTo(x,y)
    rot+=step
  }
  ctx.lineTo(cx,cy-outerRadius);
  ctx.closePath();
  ctx.lineWidth=5;
  ctx.fill();
}

function addZeros(value, zeros){
	value = `${value}`
	for(let i = value.length; i < zeros; i++) value = `0${value}`
	return value
}