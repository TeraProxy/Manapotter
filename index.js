const jobs = require('./jobs')

module.exports = function Manapotter(dispatch) {
	
	let cid = { low: 0, high: 0, unsigned: true },
		model = 0,
		job = -1,
		cooldown = false,
		currentLocation = null,
		enabled = true
		justrezzed = false
	
	dispatch.hook('S_LOGIN', 1, event => {
		cid = event.cid
		model = event.model
		job = (model - 10101) % 100
		
		let jobName = getJob(job)
		if((jobName == 'Slayer') || (jobName == 'Berserker')) enabled = false

		if(!enabled) console.log('[Manapotter] You are currently playing as ' + jobName + '. Manapotter disabled.')
	})
	
	dispatch.hook('C_PLAYER_LOCATION', 1, event => {
		currentLocation = event
	})
	
	dispatch.hook('C_REVIVE_NOW', 1, (event) => { // when accepting a rez
		justrezzed = true
		setTimeout(function () {
			justrezzed = false
		}, 10000)
	})
	
	dispatch.hook('S_SPAWN_ME', 1, event => { // when being spawned
		justrezzed = true
		setTimeout(function () {
			justrezzed = false
		}, 10000)
	})
	
	dispatch.hook('S_START_COOLTIME_ITEM', 1, event => { 
		if (!enabled) return
		let item = event.item
		let thiscooldown = event.cooldown
		
		if(item == 6562) { // has 10 seconds cooldown
			cooldown = true
			setTimeout(() => {
				cooldown = false
			}, thiscooldown*1000)
		}
	})
	
	dispatch.hook('S_PLAYER_CHANGE_MP', 1, event => {
		if (!enabled) return
		currentMp = event.currentMp
		maxMp = event.maxMp
		
		if((justrezzed == false) && (cooldown == false) && event.target.equals(cid) && (currentMp <= maxMp/2)) {
			useItem(0)
		}
	})
	
	function useItem(id) {
		dispatch.toServer('C_USE_ITEM', 1, {
			ownerId: cid,
			item: 6562, // 6562: Prime Replenishment Potable, 184659: Everful Nostrum
			id: id,
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: 1,
			unk5: 0,
			unk6: 0,
			unk7: 0,
			x: currentLocation.x, 
			y: currentLocation.y, 
			z: currentLocation.z, 
			w: currentLocation.w, 
			unk8: 0,
			unk9: 0,
			unk10: 0,
			unk11: 1,
		})
	}
	
	/*dispatch.hook('C_USE_ITEM', 1, event => { // just for logging
		let ownerId = event.ownerId
		let item = event.item
		let id = event.id
		let unk1 = event.unk1
		let unk2 = event.unk2
		let unk3 = event.unk3
		let unk4 = event.unk4
		let unk5 = event.unk5
		let unk6 = event.unk6
		let unk7 = event.unk7

		let x = event.x
		let y = event.y
		let z = event.z
		let w = event.w

		let unk8 = event.unk8
		let unk9 = event.unk9
		let unk10 = event.unk10
		let unk11 = event.unk11
		
		console.log('[Manapotter] ownerId ' + ownerId + ' item ' + item + ' id ' + id + ' unk1 ' + unk1 + ' unk2 ' + unk2 + ' unk3 ' + unk3)
		console.log('[Manapotter] unk4 ' + unk4 + ' unk5 ' + unk5 + ' unk6 ' + unk6 + ' unk7 ' + unk7 + ' unk8 ' + unk8 + ' unk9 ' + unk9)
		console.log('[Manapotter] unk10 ' + unk10 + ' unk11 ' + unk11 + ' x ' + x + ' y ' + y + ' z ' + z + ' w ' + w)
	})*/
	
	function get(obj, ...keys) {
		if(obj === undefined) return

		for(let key of keys)
			if((obj = obj[key]) === undefined)
				return

		return obj
	}
	
	function getJob(jobNumber) {
		return get(jobs, job, "name") || "Undefined"
	}
	
	dispatch.hook('C_WHISPER', 1, (event) => {
		if (/^<FONT>!manapotter?<\/FONT>$/i.test(event.message)) {
			if (!enabled) {
				enabled = true
				message('Manapotter <font color="#00EE00">enabled</font>. Whisper "!manapotter" to disable.')
			}
			else {
				enabled = false
				message('Manapotter <font color="#DC143C">disabled</font>. Whisper "!manapotter" to enable.')
			}
			return false
		}
	})
  
	function message(msg) {
		dispatch.toClient('S_CHAT', 1, {
			channel: 24,
			authorID: 0,
			unk1: 0,
			gm: 0,
			unk2: 0,
			authorName: '',
			message: '(Manapotter)' + msg
		})
	}
}