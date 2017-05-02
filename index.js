const jobs = require('./jobs')

module.exports = function Manapotter(dispatch) {
	
	let cid = null,
		model = 0,
		job = -1,
		cooldown = false,
		enabled = true,
		battleground,
		onmount,
		incontract,
		inbattleground,
		alive,
		justrezzed = false
	
	dispatch.hook('S_LOGIN', 1, event => {
		({cid} = event)
		model = event.model
		job = (model - 10101) % 100
		
		let jobName = getJob(job)
		if((jobName == 'Slayer') || (jobName == 'Berserker')) enabled = false

		if(!enabled) console.log('[Manapotter] You are currently playing as ' + jobName + '. Manapotter disabled.')
	})
	
	dispatch.hook('C_REVIVE_NOW', 1, (event) => { // when accepting a rez
		justrezzed = true
		setTimeout(function () {
			justrezzed = false
		}, 30000)
	})
	
	dispatch.hook('S_START_COOLTIME_ITEM', 1, event => { 
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
		currentMp = event.currentMp
		maxMp = event.maxMp
		
		if(!justrezzed && !cooldown && event.target.equals(cid) && (currentMp <= maxMp/2)) {
			useItem()
		}
	})
	
	function useItem() {
		if (!enabled) return
		if(alive && !onmount && !incontract && !inbattleground) {
			dispatch.toServer('C_USE_ITEM', 1, {
				ownerId: cid,
				item: 6562, // 6562: Prime Replenishment Potable, 184659: Everful Nostrum
				id: 0,
				unk1: 0,
				unk2: 0,
				unk3: 0,
				unk4: 1,
				unk5: 0,
				unk6: 0,
				unk7: 0,
				x: 0, 
				y: 0, 
				z: 0, 
				w: 0, 
				unk8: 0,
				unk9: 0,
				unk10: 0,
				unk11: 1,
			})
		}
	}
	
	// ##############
	// ### Checks ###
	// ##############
	
	dispatch.hook('S_BATTLE_FIELD_ENTRANCE_INFO', 1, event => { battleground = event.zone })
	dispatch.hook('S_LOAD_TOPO', 1, event => {
		onmount = false
		incontract = false
		inbattleground = event.zone == battleground
	})
	
	dispatch.hook('S_SPAWN_ME', 1, event => { 
		alive = event.alive 
		justrezzed = true
		setTimeout(function () {
			justrezzed = false
		}, 30000)
	})
	dispatch.hook('S_CREATURE_LIFE', 1, event => {
		if(event.target.equals(cid) && (alive != event.alive)) {
			if(!alive) {
				onmount = false
				incontract = false
			}
		}
	})

	dispatch.hook('S_MOUNT_VEHICLE', 1, event => { if(event.target.equals(cid)) onmount = true })
	dispatch.hook('S_UNMOUNT_VEHICLE', 1, event => { if(event.target.equals(cid)) onmount = false })

	dispatch.hook('S_REQUEST_CONTRACT', 1, event => { incontract = true })
	dispatch.hook('S_ACCEPT_CONTRACT', 1, event => { incontract = false })
	dispatch.hook('S_REJECT_CONTRACT', 1, event => { incontract = false })
	dispatch.hook('S_CANCEL_CONTRACT', 1, event => { incontract = false })
	
	
	// ########################
	// ### Helper Functions ###
	// ########################
	
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
	
	
	// #################
	// ### Chat Hook ###
	// #################
	
	dispatch.hook('C_WHISPER', 1, (event) => {
		if(event.target.toUpperCase() === "!manapotter".toUpperCase()) {
			if (/^<FONT>on?<\/FONT>$/i.test(event.message)) {
				enabled = true
				message('Manapotter <font color="#00EE00">enabled</font>.')
			}
			else if (/^<FONT>off?<\/FONT>$/i.test(event.message)) {
				enabled = false
				message('Manapotter <font color="#DC143C">disabled</font>.')
			}
			else message('Commands: "on" (enable Manapotter),'
								+ ' "off" (disable Manapotter)'
						)
			return false
		}
	})
	
	function message(msg) {
		dispatch.toClient('S_WHISPER', 1, {
			player: cid,
			unk1: 0,
			gm: 0,
			unk2: 0,
			author: '!Manapotter',
			recipient: player,
			message: msg
		})
	}
}