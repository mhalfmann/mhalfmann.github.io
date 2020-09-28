//
// description:		module controlling the flow of pages 
// author:			Leibniz-Institut fuer Wissensmedien Tuebingen, Andre Klemke
//

class Page {
	constructor(pagecfg) {
		this.pagecfg = pagecfg
		this.pageid = pagecfg.pageid
		this.src = pagecfg.src
		this.nextid = pagecfg.nextid
		this.nextlabel = this.getValueOrDefault(pagecfg.nextlabel,"weiter")
		this.backid = pagecfg.backid
		this.backlabel = this.getValueOrDefault(pagecfg.backlabel,"zur" + String.fromCharCode(252) + "ck")
		this.progress = pagecfg.progress
		this.computedprogress
		this.isfirst = this.getValueOrDefault(pagecfg.first,false)
		this.isnextallowed = this.getValueOrDefault(pagecfg.nextallowed,true)
		this.isbackallowed = this.getValueOrDefault(pagecfg.backallowed,true)
		this.iscontrolsvisible = this.getValueOrDefault(pagecfg.controlsvisible,true)
		this.keyboardnextkeycode = pagecfg.keyboardnextkeycode
		this.pagegroup = pagecfg.pagegroup
		this.mintime = pagecfg.mintime				
		this.maxtime = pagecfg.maxtime
		this.currenttime = 0
		this.onlyuser = pagecfg.onlyuser
		this.onlydata = pagecfg.onlydata
		this.maxvisits = pagecfg.maxvisits
		this.currentvisits = 0
		this.layout = pagecfg.layout
        this.param = pagecfg.param
        this.initdelay = pagecfg.initdelay
        this.syncid = pagecfg.syncid
        this.syncblockreleased = false
        if(this.syncid == null || this.syncid == ""){
            this.syncblockreleased = true
        }
	}

	getPageinfoForAddon(){
		return {pageid:this.pageid, src:this.src, isfirst:this.isfirst, layout:this.layout, param:this.param, maxtime:this.maxtime, mintime:this.mintime, currenttime:this.currenttime, progress:this.progress, computedprogress:this.computedprogress, isnextallowed:this.isnextallowed, isbackallowed:this.isbackallowed, iscontrolsvisible:this.iscontrolsvisible, nextlabel:this.nextlabel, backlabel:this.backlabel, currentvisits:this.currentvisits, keyboardnextkeycode:this.keyboardnextkeycode, initdelay:this.initdelay, syncid:this.syncid, syncblockreleased:this.syncblockreleased}
	}
    
    getValueOrDefault(value, defaultvalue){
        let returnvalue
		if(value == null){
			returnvalue = defaultvalue
		}
		else{
			returnvalue = value
		}		
		return returnvalue
    }	
}

class Pagegroup {
	constructor(pagegroupcfg) {		
		this.pagegroupid = pagegroupcfg.pagegroupid		
		this.mintime = pagegroupcfg.mintime
		this.maxtime = pagegroupcfg.maxtime		
		this.maxvisits = pagegroupcfg.maxvisits
		this.currenttime = 0
		this.currentvisits = 0
    }
}

class TargetBlock {
	constructor(targetexpressionpart, flowcontrol) {	
		this.callbacksuccess
		this.callbackfailure
		this.uncheckedpages = []
		this.validpages = []
		this.pagevisitdata = new Map()
		this.flowcontrol = flowcontrol
		this.loadingformfields = 0
		for(let p of targetexpressionpart.split("*")){			
            if(flowcontrol.pagepool.has(p)){
                this.uncheckedpages.push(flowcontrol.pagepool.get(p))
            }
            else{
                let event = new CustomEvent('iwmstudyerror', { detail: { error: "flowerror", errordescription: "Fehler im Ablauf. Ungültige pageid " + p + " als mögliche Folgeseite für " + flowcontrol.currentpage.pageid + " definiert."} })
                window.dispatchEvent(event)
            }
		}		
	}
	
	check(callbacksuccess, callbackfailure){
		this.callbacksuccess = callbacksuccess
		this.callbackfailure = callbackfailure
		for(let p of this.uncheckedpages){
			if(p.onlydata != "" && p.onlydata != null){
				let od = p.onlydata.split("&&")
				for(let d of od){
					this.loadingformfields++
					let event = new CustomEvent('pagevisitformdatarequest', { detail : {form : d.split("==")[0], callback : this.addFormdata.bind(this)} })
					window.dispatchEvent(event)
				}
			}
		}
		if(this.loadingformfields == 0){
			this.process()
		}		
	}
	
	addFormdata(form, data){		
		this.pagevisitdata.set(form,data)
		this.loadingformfields--
		if(this.loadingformfields == 0){
			this.process()
		}
	}
	
	process(){
		for(let p of this.uncheckedpages){
			let valid = true
			if(p.onlydata != "" && p.onlydata != null){
				let od = p.onlydata.split("&&")
				for(let d of od){					
					if(this.pagevisitdata.get(d.split("==")[0]) != d.split("==")[1]){
						valid = false
					}
				}
			}			
			if(p.onlyuser != "" && p.onlyuser != null){
				//todo
			}			
			if(p.maxvisits != "" && p.maxvisits != null){
				if(p.currentvisits >= p.maxvisits){
					valid = false
				}
            }
            if(p.pagegroup != null && p.pagegroup != ""){
                let pg = this.flowcontrol.pagegrouppool.get(p.pagegroup)
                if(pg.maxvisits != null && pg.maxvisits != "" && pg.currentvisits >= pg.maxvisits){
                    valid = false
                }
            }
			if(valid){
				this.validpages.push(p)
			}
		}		
		if(this.validpages.length > 0){						
			let target = this.validpages[this.createRandomIntFromInterval(0,this.validpages.length-1)].pageid
			this.callbacksuccess.bind(this.flowcontrol)(target)
		}
		else{
			this.callbackfailure.bind(this.flowcontrol)()
		}
	}
	
	createRandomIntFromInterval(min,max){
		return Math.floor(Math.random()*(max-min+1)+min)
	}
}

class FlowControl {
	constructor() {
		this.pagepool = new Map()
		this.pagegrouppool = new Map()
		this.currentpage
		this.pagecounter = 0
		this.backcounter = 0
		this.progressmaxpagecount
		this.uncheckedtargetblocks
		this.history = []
    }
    
    getAllPageMetadata(){
        let pm = {}
        for(let p of this.pagepool){           
            pm[p[0]] = p[1]
        }
        return pm
    }

    getAllPagegroupMetadata(){
        let pgm = {}
        for(let pg of this.pagegrouppool){           
            pgm[pg[0]] = pg[1]
        }
        return pgm
    }

    getPagegroupinfoForAddon(){
        if(this.currentpage.pagegroup != null && this.currentpage.pagegroup != ""){
            let pg = this.pagegrouppool.get(this.currentpage.pagegroup)
            return {pagegroupid:pg.pagegroupid, mintime:pg.mintime, maxtime:pg.maxtime, maxvisits:pg.maxvisits, currenttime:pg.currenttime, currentvisits:pg.currentvisits}
        }
        else{
            return null
        }
	}
	
	initFromConditionConfig(condcfg, manualfirstpage){		
		let allpgs = condcfg.pagegroups
		let allps = condcfg.pages
		this.progressmaxpagecount = condcfg.progressmaxpagecount
		if(this.progressmaxpagecount == null){
			this.progressmaxpagecount = allps.length
		}		
		for(let i=0; i<allpgs.length; i++){
			let pg = allpgs[i]
			this.pagegrouppool.set(pg.pagegroupid,new Pagegroup(pg))
		}		
		let firstpageid
		for(let i=0; i<allps.length; i++){
			let p = allps[i]
			this.pagepool.set(p.pageid,new Page(p))
			if(this.pagepool.get(p.pageid).isfirst){
				firstpageid = p.pageid				
			}
		}
		if(manualfirstpage != ""){
			if(this.pagepool.has(manualfirstpage)){
				firstpageid = manualfirstpage;
			}
			else{
				alert("Gewuenschte Startseite nicht gueltig. Standardseite wird verwendet.")
			}
		}		
		this.choosePage(firstpageid)
    }
    
    initFromRunUserData(condcfg, continuedrunuserdata){
        console.log("init flow from userdata")
        let allpgs = condcfg.pagegroups
		let allps = condcfg.pages
		this.progressmaxpagecount = condcfg.progressmaxpagecount
		if(this.progressmaxpagecount == null){
			this.progressmaxpagecount = allps.length
		}		
        //init with metadata from config
        for(let i=0; i<allpgs.length; i++){
			let pg = allpgs[i]
			this.pagegrouppool.set(pg.pagegroupid,new Pagegroup(pg))
		}		
		for(let i=0; i<allps.length; i++){
			let p = allps[i]
			this.pagepool.set(p.pageid,new Page(p))			
        }
        //add metadata from user
        let pgmd = continuedrunuserdata["pagegroupmetadata"]        
        for(let i = 0; i < Object.keys(pgmd).length; i++){
            let pgid = Object.keys(pgmd)[i]            
            if(this.pagegrouppool.has(pgid)){
                let pagegroup = this.pagegrouppool.get(pgid)
                let storedpagegroup = pgmd[pgid]
                for(let j = 0; j < Object.keys(pagegroup).length; j++){
                    let attrname = Object.keys(pagegroup)[j]
                    if(storedpagegroup[attrname] != null){
                        pagegroup[attrname] = storedpagegroup[attrname]
                    }   
                }
            }
        }
        let pmd = continuedrunuserdata["pagemetadata"]        
        for(let i = 0; i < Object.keys(pmd).length; i++){
            let pid = Object.keys(pmd)[i]            
            if(this.pagepool.has(pid)){
                let page = this.pagepool.get(pid)
                let storedpage = pmd[pid]
                for(let j = 0; j < Object.keys(page).length; j++){
                    let attrname = Object.keys(page)[j]
                    if(storedpage[attrname] != null){
                        page[attrname] = storedpage[attrname]
                    }   
                }
            }
        }        
        this.pagecounter = continuedrunuserdata["pagecounter"]
        this.backcounter = continuedrunuserdata["backcounter"]
        this.history = continuedrunuserdata["pagehistory"].split(",")
        this.continuePage(continuedrunuserdata["currentpage"])
    }
    
    addCurrentPageVisittime(visittime){
        this.currentpage.currenttime = this.currentpage.currenttime + visittime
        if(this.currentpage.pagegroup != null && this.currentpage.pagegroup != ""){
            let pg = this.pagegrouppool.get(this.currentpage.pagegroup)
            pg.currenttime = pg.currenttime + visittime
        }
    }

	changePage(targetpageid){
		let targetexpression = this.currentpage.nextid
		if(targetpageid != null){
			targetexpression = targetpageid
		}
		this.uncheckedtargetblocks = []
		for(let part of targetexpression.split("|")){
			this.uncheckedtargetblocks.push(new TargetBlock(part, this))
		}
		this.processTargetBlocks()
	}
	
	processTargetBlocks(){
		if(this.uncheckedtargetblocks.length > 0){
			let tb = this.uncheckedtargetblocks.shift()
			tb.check(this.choosePage, this.processTargetBlocks)
        }
        else{
            let event = new CustomEvent('iwmstudyerror', { detail: { error: "flowerror", errordescription: "Fehler im Ablauf. Keine Folgeseite für " + this.currentpage.pageid + " verfügbar."} })
            window.dispatchEvent(event)            
        }
	}
	
	previousPage(){		
		let pid
		if(this.currentpage.backid != null){
			pid = this.currentpage.backid
		}
		else if(this.history.length > 1){
        	let currentid = this.history.pop()
        	let previousid = this.history.pop()
        	pid = previousid	
        }
		let pageallowed = false
		if(pid != null){
			if(this.pagepool.has(pid)){
				let p = this.pagepool.get(pid)
				if(p.maxvisits){
					if(p.maxvisits > p.currentvisits){
						pageallowed = true
					}
				}
				else{
					pageallowed = true
				}
			}
		}
		if(pageallowed){
			this.backcounter++
			this.choosePage(pid)
		}
		else{
			this.choosePage(this.currentpage.pageid)
		}
	}
	
	choosePage(target){
		this.currentpage = this.pagepool.get(target)
        this.currentpage.currentvisits++
        if(this.currentpage.pagegroup != null && this.currentpage.pagegroup != ""){
            let pg = this.pagegrouppool.get(this.currentpage.pagegroup)
            pg.currentvisits++
        }
		this.pagecounter++
		this.currentpage.computedprogress = (this.pagecounter - (this.backcounter*2)) / this.progressmaxpagecount
		this.history.push(this.currentpage.pageid)
		console.log(`page chosen ${this.currentpage.pageid}`)
		let event = new CustomEvent('pagechosen', { detail : {page : this.currentpage} })
		window.dispatchEvent(event)
    }
    
    continuePage(target){        
		this.currentpage = this.pagepool.get(target)
        this.currentpage.currentvisits++
        if(this.currentpage.pagegroup != null && this.currentpage.pagegroup != ""){
            let pg = this.pagegrouppool.get(this.currentpage.pagegroup)
            pg.currentvisits++
        }
        this.pagecounter++		
        this.currentpage.computedprogress = (this.pagecounter - (this.backcounter*2)) / this.progressmaxpagecount
        this.history.push(this.currentpage.pageid)		
		console.log(`continue page ${this.currentpage.pageid}`)
		let event = new CustomEvent('pagechosen', { detail : {page : this.currentpage} })
		window.dispatchEvent(event)
    }
    
    releaseSyncblock(syncid){
        if(this.currentpage.syncid == syncid){
            this.currentpage.syncblockreleased = true
            return true
        }
        else{
            return false
        }
    }
}