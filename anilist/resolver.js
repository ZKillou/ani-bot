module.exports = {
	resolveSeason: (season) => {
		if(season == "WINTER") return "Hiver"
		if(season == "SPRING") return "Printemps"
		if(season == "SUMMER") return "Été"
		if(season == "FALL") return "Automne"
		return season
	},
	
	resolveFormat: (format) => {
		if(format == "TV") return "TV"
		if(format == "TV_SHORT") return "TV Court Métrage"
		if(format == "MOVIE") return "Film"
		if(format == "SPECIAL") return "Spécial"
		if(format == "OVA") return "OAV"
		if(format == "ONA") return "ONA"
		if(format == "MUSIC") return "Musique"
		return format
	},
	
	resolveStatus: (status) => {
		if(status == "FINISHED") return "Terminé"
		if(status == "RELEASING") return "En cours de diffusion"
		if(status == "NOT_YET_RELEASED") return "Pas encore diffusé"
		if(status == "CANCELLED") return "Annulé"
		if(status == "HIATUS") return "Suspendu"
		return status
	},
	
	resolveSource: (source) => {
		if(source == "ORIGINAL") return "Original"
		if(source == "MANGA") return "Manga"
		if(source == "LIGHT_NOVEL") return "Roman illustré"
		if(source == "VISUAL_NOVEL") return "Roman visuel"
		if(source == "VIDEO_GAME") return "Jeu vidéo"
		if(source == "OTHER") return "Autre"
		if(source == "ORIGINAL") return "Original"
		if(source == "NOVEL") return "Roman"
		if(source == "DOUJINSHI") return "Doujin"
		if(source == "ANIME") return "Anime"
		if(source == "WEB_NOVEL") return "Roman web"
		if(source == "LIVE_ACTION") return "Prises de vues réelles"
		if(source == "GAME") return "Jeu"
		if(source == "COMIC") return "Comic"
		if(source == "MULTIMEDIA_PROJECT") return "Projet multimédia"
		if(source == "PICTURE_BOOK") return "Livre d'image"
		return source
	},
	
	resolveRelation: (relation) => {
		if(relation == "ADAPTATION") return "Adaptation"
		if(relation == "PREQUEL") return "Préquel"
		if(relation == "SEQUEL") return "Suite"
		if(relation == "PARENT") return "Parent"
		if(relation == "SIDE_STORY") return "Histoire parallèle"
		if(relation == "CHARACTER") return "Personnage"
		if(relation == "SUMMARY") return "Résumé"
		if(relation == "ALTERNATIVE") return "Alternatif"
		if(relation == "SPIN_OFF") return "Spin off"
		if(relation == "OTHER") return "Autre"
		return relation
	},
	
	resolveType: (type) => {
		if(type == "ANIME") return "Anime"
		if(type == "MANGA") return "Manga"
		return type
	},
	
	resolveRole: (role) => {
		if(role == "MAIN") return "Principal"
		if(role == "SUPPORTING") return "Support"
		if(role == "BACKGROUND") return "Arrière-plan"
		return role
	},
}