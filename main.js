/*
All this code is copyright Orteil, 2013.
Spoilers ahead.
http://orteil.dashnet.org
*/

/*=====================================================================================
MISC HELPER FUNCTIONS
=======================================================================================*/
function l(what) {return document.getElementById(what);}
function choose(arr) {return arr[Math.floor(Math.random()*arr.length)];}

function shuffle(array)
{
	var counter = array.length, temp, index;
	// While there are elements in the array
	while (counter--)
	{
		// Pick a random index
		index = (Math.random() * counter) | 0;

		// And swap the last element with it
		temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}
	return array;
}
function Beautify(what,floats)//turns 9999999 into 9,999,999
{
	var str='';
	if (floats>0)
	{
		var integer=what;
		var floater=Math.round(integer*Math.pow(10,floats)-Math.floor(integer)*Math.pow(10,floats));
		str=Beautify(integer)+(floater?('.'+floater):'');
	}
	else
	{
		what=Math.floor(what);
		what=(what+'').split('').reverse();
		for (var i in what)
		{
			if (i%3==0 && i>0) str=','+str;
			str=what[i]+str;
		}
	}
	return str;
}
function utf8_to_b64( str ) {
	try{
		return window.btoa(unescape(encodeURIComponent( str )));
	}
	catch(err)
	{
		Popup('There was a problem while encrypting to base64.<br>('+err+')');
		return '';
	}
}

function b64_to_utf8( str ) {
	try{
		return decodeURIComponent(escape(window.atob( str )));
	}
	catch(err)
	{
		Popup('There was a problem while decrypting from base64.<br>('+err+')');
		return '';
	}
}



/*=====================================================================================
GAME INITIALIZATION
=======================================================================================*/
Game={};

Game.Launch=function()
{
	Game.ready=0;
	Game.Init=function()
	{
		Game.ready=1;

		/*=====================================================================================
		VARIABLES AND PRESETS
		=======================================================================================*/
		Game.T=0;
		Game.fps=30;

		Game.version=1.030;
		Game.beta=0;
		l('versionNumber').innerHTML='v.'+Game.version+(Game.beta?' <span style="color:#ff0;">beta</span>':'');
		//l('links').innerHTML=(Game.beta?'<a href="../" target="blank">Live version</a> | ':'<a href="beta" target="blank">Try the beta!</a> | ')+'<a href="https://web.archive.org/web/20130828224607/http://orteil.dashnet.org/experiments/cookie/" target="blank">Cookie Clicker Classic</a>';
		l('links').innerHTML='<a href="https://web.archive.org/web/20130828224607/http://orteil.dashnet.org/experiments/cookie/" target="blank">Cookie Clicker Classic</a>';

		//latency compensator stuff
		Game.time=new Date().getTime();
		Game.fpsMeasure=new Date().getTime();
		Game.accumulatedDelay=0;
		Game.catchupLogic=0;

		Game.cookiesEarned=0;//all cookies earned during gameplay
		Game.cookies=0;//cookies
		Game.cookiesd=0;//cookies display
		Game.cookiesPs=1;//cookies per second (to recalculate with every new purchase)
		Game.cookiesReset=0;//cookies lost to resetting
		Game.frenzy=0;//as long as >0, cookie production is doubled
		Game.cookieClicks=0;//+1 for each click on the cookie
		Game.goldenClicks=0;//+1 for each golden cookie clicked
		Game.missedGoldenClicks=0;//+1 for each golden cookie missed
		Game.handmadeCookies=0;//all the cookies made from clicking the cookie
		Game.milkProgress=0;//+0.01 for each achievement; 0-1 : milk; 1-2 : chocolate milk; 2-3 : strawberry juice
		Game.milkH=Game.milkProgress/2;//milk height, between 0 and 1 (although should never go above 0.5)
		Game.milkHd=0;//milk height display
		Game.milkType=-1;//custom milk : 0=plain, 1=chocolate...
		Game.backgroundType=-1;//custom background : 0=blue, 1=red...

		Game.bg='';//background (grandmas and such)
		Game.bgFade='';//fading to background
		Game.bgR=0;//ratio (0 - not faded, 1 - fully faded)
		Game.bgRd=0;//ratio displayed

		Game.startDate=parseInt(new Date().getTime());

		Game.prefs=[];
		Game.DefaultPrefs=function()
		{
			Game.prefs.particles=1;
			Game.prefs.numbers=1;
			Game.prefs.autosave=1;
			Game.prefs.autoupdate=1;
			Game.prefs.milk=1;
		}
		Game.DefaultPrefs();

		/*=====================================================================================
		UPDATE CHECKER (broken?)
		=======================================================================================*/
		Game.CheckUpdates=function()
		{
			ajax('server.php?q=checkupdate',Game.CheckUpdatesResponse);
		}
		Game.CheckUpdatesResponse=function(response)
		{
			var r=response.split['|'];
			if (parseFloat(r[0])>Game.version)
			{
				var str='New version available : '+r[0]+'!';
				if (r[1]) str+='<br>"'+r[1]+'"';
				str+='<br>Refresh to get it!';
				l('alert').innerHTML=str;
				l('alert').style.display='block';
			}
		}

		/*=====================================================================================
		SAVE
		=======================================================================================*/
		Game.ExportSave=function()
		{
			var save=prompt('Copy this text and keep it somewhere safe!',Game.WriteSave(1));
		}
		Game.ImportSave=function()
		{
			var save=prompt('Please paste in the text that was given to you on save export.','');
			if (save && save!='') Game.LoadSave(save);
			Game.WriteSave();
		}

		Game.WriteSave=function(exporting)//guess what we'e using to save the game?
		{
			var str='';
			str+=Game.version+'|';
			str+='|';//just in case we need some more stuff here
			str+=//save stats
			Game.startDate+//parseInt(new Date().getTime())+
			'|';
			str+=//prefs
			(Game.prefs.particles?'1':'0')+
			(Game.prefs.numbers?'1':'0')+
			(Game.prefs.autosave?'1':'0')+
			(Game.prefs.autoupdate?'1':'0')+
			(Game.prefs.milk?'1':'0')+
			'|';
			str+=parseInt(Math.floor(Game.cookies))+';'+
			parseInt(Math.floor(Game.cookiesEarned))+';'+
			parseInt(Math.floor(Game.cookieClicks))+';'+
			parseInt(Math.floor(Game.goldenClicks))+';'+
			parseInt(Math.floor(Game.handmadeCookies))+';'+
			parseInt(Math.floor(Game.missedGoldenClicks))+';'+
			parseInt(Math.floor(Game.backgroundType))+';'+
			parseInt(Math.floor(Game.milkType))+';'+
			parseInt(Math.floor(Game.cookiesReset))+
			'|';//cookies
			for (var i in Game.Objects)//buildings
			{
				var me=Game.Objects[i];
				str+=me.amount+','+me.bought+','+Math.floor(me.totalCookies)+';';
			}
			str+='|';
			for (var i in Game.Upgrades)//upgrades
			{
				var me=Game.Upgrades[i];
				str+=me.unlocked+','+me.bought+';';
			}
			str+='|';
			for (var i in Game.Achievements)//achievements
			{
				var me=Game.Achievements[i];
				str+=me.won+';';
			}

			if (exporting)
			{
				str=escape(utf8_to_b64(str)+'!END!');
				return str;
			}
			else
			{
				//that's right
				//we're using cookies
				//yeah I went there
				var now=new Date();//we storin dis for 5 years, people
				now.setFullYear(now.getFullYear()+5);//mmh stale cookies
				str=utf8_to_b64(str)+'!END!';
				document.cookie='CookieClickerGame='+escape(str)+'; expires='+now.toUTCString()+';';//aaand save

				if (document.cookie.indexOf('CookieClickerGame')<0) Game.Popup('Error while saving.<br>Export your save instead!');
				else Game.Popup('Game saved');
			}
		}

		/*=====================================================================================
		LOAD
		=======================================================================================*/
		Game.LoadSave=function(data)
		{
			var str='';
			if (data) str=unescape(data);
			else if (document.cookie.indexOf('CookieClickerGame')>=0) str=unescape(document.cookie.split('CookieClickerGame=')[1]);//get cookie here

			if (str!='')
			{
				var version=0;
				var oldstr=str.split('|');
				if (oldstr[0]<1) {}
				else
				{
					str=str.split('!END!')[0];
					str=b64_to_utf8(str);
				}
				if (str!='')
				{
					var spl='';
					str=str.split('|');
					version=parseFloat(str[0]);
					if (version>=1 && version>Game.version)
					{
						alert('Error : you are attempting to load a save from a later version (v.'+version+'; you are using v.'+Game.version+').');
						return;
					}
					else if (version>=1)
					{
						spl=str[2].split(';');//save stats
						Game.startDate=spl[0];
						spl=str[3].split('');//prefs
						Game.prefs.particles=parseInt(spl[0]);
						Game.prefs.numbers=parseInt(spl[1]);
						Game.prefs.autosave=parseInt(spl[2]);
						Game.prefs.autoupdate=spl[3]?parseInt(spl[3]):1;
						Game.prefs.milk=spl[4]?parseInt(spl[4]):1;
						spl=str[4].split(';');//cookies
						Game.cookies=parseInt(spl[0]);Game.cookiesEarned=parseInt(spl[1]);
						Game.cookieClicks=spl[2]?parseInt(spl[2]):0;
						Game.goldenClicks=spl[3]?parseInt(spl[3]):0;
						Game.handmadeCookies=spl[4]?parseInt(spl[4]):0;
						Game.missedGoldenClicks=spl[5]?parseInt(spl[5]):0;
						Game.backgroundType=spl[6]?parseInt(spl[6]):0;
						Game.milkType=spl[7]?parseInt(spl[7]):0;
						Game.cookiesReset=spl[8]?parseInt(spl[8]):0;
						spl=str[5].split(';');//buildings
						Game.BuildingsOwned=0;
						for (var i in Game.ObjectsById)
						{
							var me=Game.ObjectsById[i];
							if (spl[i])
							{
								var mestr=spl[i].split(',');
								me.amount=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);me.totalCookies=parseInt(mestr[2]);
								Game.BuildingsOwned+=me.amount;
							}
							else
							{
								me.unlocked=0;me.bought=0;me.totalCookies=0;
							}
							me.refresh();
						}
						spl=str[6].split(';');//upgrades
						Game.UpgradesOwned=0;
						for (var i in Game.UpgradesById)
						{
							var me=Game.UpgradesById[i];
							if (spl[i])
							{
								var mestr=spl[i].split(',');
								me.unlocked=parseInt(mestr[0]);me.bought=parseInt(mestr[1]);
								if (me.bought) Game.UpgradesOwned++;
							}
							else
							{
								me.unlocked=0;me.bought=0;
							}
						}
						if (str[7]) spl=str[7].split(';'); else spl=[];//achievements
						Game.AchievementsOwned=0;
						for (var i in Game.AchievementsById)
						{
							var me=Game.AchievementsById[i];
							if (spl[i])
							{
								var mestr=spl[i].split(',');
								me.won=parseInt(mestr[0]);
							}
							else
							{
								me.won=0;
							}
							if (me.won && me.hide!=3) Game.AchievementsOwned++;
						}


						for (var i in Game.ObjectsById)
						{
							var me=Game.ObjectsById[i];
							if (me.buyFunction) me.buyFunction();
						}
					}
					else//importing old version save
					{
						Game.startDate=parseInt(new Date().getTime());
						Game.cookies=parseInt(str[1]);
						Game.cookiesEarned=parseInt(str[1]);

						for (var i in Game.ObjectsById)
						{
							var me=Game.ObjectsById[i];
							me.amount=0;me.bought=0;me.totalCookies=0;
							me.refresh();
						}
						for (var i in Game.UpgradesById)
						{
							var me=Game.UpgradesById[i];
							me.unlocked=0;me.bought=0;
						}

						var moni=0;
						moni+=15*Math.pow(1.1,parseInt(str[2]));
						moni+=100*Math.pow(1.1,parseInt(str[4]));
						moni+=500*Math.pow(1.1,parseInt(str[6]));
						moni+=2000*Math.pow(1.1,parseInt(str[8]));
						moni+=7000*Math.pow(1.1,parseInt(str[10]));
						moni+=50000*Math.pow(1.1,parseInt(str[12]));
						moni+=1000000*Math.pow(1.1,parseInt(str[14]));
						if (parseInt(str[16])) moni+=123456789*Math.pow(1.1,parseInt(str[16]));

						alert('Imported old save from version '+version+'; recovered '+Beautify(Game.cookies)+' cookies, and converted buildings back to '+Beautify(moni)+' cookies.');

						Game.cookies+=moni;
						Game.cookiesEarned+=moni;
					}
					Game.RebuildUpgrades();

					Game.TickerAge=0;

					Game.recalculateGains=1;
					Game.storeToRebuild=1;
					Game.upgradesToRebuild=1;
					Game.Popup('Game loaded');
				}
			}
		}

		/*=====================================================================================
		RESET
		=======================================================================================*/
		Game.Reset=function(bypass)
		{
			if (bypass || confirm('Do you REALLY want to start over?\n(your will lose your progress, but you will keep your achievements.)'))
			{
				if (!bypass)
				{
					if (Game.cookies>=1000000) Game.Win('Sacrifice');
					if (Game.cookies>=1000000000) Game.Win('Oblivion');
					if (Game.cookies>=1000000000000) Game.Win('From scratch');
				}
				Game.cookiesReset+=Game.cookies;
				Game.cookies=0;
				Game.cookiesEarned=0;
				Game.cookieClicks=0;
				Game.goldenClicks=0;
				Game.handmadeCookies=0;
				Game.missedGoldenClicks=0;
				Game.backgroundType=-1;
				Game.milkType=-1;
				for (var i in Game.ObjectsById)
				{
					var me=Game.ObjectsById[i];
					me.amount=0;me.bought=0;me.totalCookies=0;
					me.refresh();
				}
				for (var i in Game.UpgradesById)
				{
					var me=Game.UpgradesById[i];
					me.unlocked=0;me.bought=0;
				}
				/*
				for (var i in Game.AchievementsById)
				{
					var me=Game.AchievementsById[i];
					me.won=0;
				}*/
				//Game.DefaultPrefs();
				Game.RebuildUpgrades();
				Game.TickerAge=0;
				Game.recalculateGains=1;
				Game.storeToRebuild=1;
				Game.upgradesToRebuild=1;
				Game.startDate=parseInt(new Date().getTime());
				Game.Popup('Game reset');
			}
		}
		Game.HardReset=function()
		{
			if (confirm('Do you REALLY want to hard-reset?\n(you will lose BOTH your progress and your achievements!)'))
			{
				if (confirm('Whoah now, are you really, REALLY sure?\n(don\'t say we didn\'t warn you!)'))
				{
					for (var i in Game.AchievementsById)
					{
						var me=Game.AchievementsById[i];
						me.won=0;
					}
					Game.BuildingsOwned=0;
					Game.UpgradesOwned=0;
					Game.AchievementsOwned=0;
					Game.Reset(1);
					Game.cookiesReset=0;
				}
			}
		}


		/*=====================================================================================
		COOKIE ECONOMICS
		=======================================================================================*/
		Game.Earn=function(howmuch)
		{
			Game.cookies+=howmuch;
			Game.cookiesEarned+=howmuch;
		}
		Game.Spend=function(howmuch)
		{
			Game.cookies-=howmuch;
		}
		Game.mouseCps=function()
		{
			var add=0;
			if (Game.Has('Thousand fingers')) add+=0.1;
			if (Game.Has('Million fingers')) add+=0.5;
			if (Game.Has('Billion fingers')) add+=2;
			if (Game.Has('Trillion fingers')) add+=10;
			if (Game.Has('Quadrillion fingers')) add+=20;
			var num=0;
			for (var i in Game.Objects) {if (Game.Objects[i].name!='Cursor') num+=Game.Objects[i].amount;}
			add=add*num;
			return Game.ComputeCps(1,Game.Has('Reinforced index finger'),Game.Has('Carpal tunnel prevention cream')+Game.Has('Ambidextrous'),add);
		}
		Game.computedMouseCps=1;
		Game.globalCpsMult=1;
		Game.lastClick=0;
		Game.ClickCookie=function()
		{
			if (new Date().getTime()-Game.lastClick<1000/250) Game.Win('Uncanny clicker');
			Game.lastClick=new Date().getTime();
			Game.Earn(Game.computedMouseCps);
			Game.handmadeCookies+=Game.computedMouseCps;
			if (Game.prefs.particles) Game.cookieParticleAdd();
			if (Game.prefs.numbers) Game.cookieNumberAdd('+'+Beautify(Game.computedMouseCps,1));
			Game.cookieClicks++;
		}
		l('bigCookie').onclick=Game.ClickCookie;
		/*=====================================================================================
		CPS RECALCULATOR
		=======================================================================================*/
		Game.recalculateGains=1;
		Game.CalculateGains=function()
		{
			Game.computedMouseCps=Game.mouseCps();
			Game.cookiesPs=0;
			var mult=1;
			mult+=Game.Has('Oatmeal raisin cookies')*0.05;
			mult+=Game.Has('Peanut butter cookies')*0.05;
			mult+=Game.Has('Plain cookies')*0.05;
			mult+=Game.Has('Coconut cookies')*0.05;
			mult+=Game.Has('White chocolate cookies')*0.05;
			mult+=Game.Has('Macadamia nut cookies')*0.05;
			mult+=Game.Has('Double-chip cookies')*0.1;
			mult+=Game.Has('Sugar cookies')*0.05;
			mult+=Game.Has('White chocolate macadamia nut cookies')*0.1;
			mult+=Game.Has('All-chocolate cookies')*0.1;
			mult+=Game.Has('Dark chocolate-coated cookies')*0.15;
			mult+=Game.Has('White chocolate-coated cookies')*0.15;

			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				me.storedCps=(typeof(me.cps)=='function'?me.cps():me.cps);
				me.storedTotalCps=me.amount*me.storedCps;
				Game.cookiesPs+=me.storedTotalCps;
			}
			Game.cookiesPs*=mult;

			if (Game.Has('Kitten helpers')) Game.cookiesPs*=(1+Game.milkProgress*0.05);
			if (Game.Has('Kitten workers')) Game.cookiesPs*=(1+Game.milkProgress*0.1);
			if (Game.Has('Kitten engineers')) Game.cookiesPs*=(1+Game.milkProgress*0.2);

			if (Game.frenzy>0) Game.cookiesPs*=2;

			for (var i=0;i<Game.cpsAchievs.length/2;i++)
			{
				if (Game.cookiesPs>=Game.cpsAchievs[i*2+1]) Game.Win(Game.cpsAchievs[i*2]);
			}


			Game.recalculateGains=0;
		}
		/*=====================================================================================
		GOLDEN COOKIE
		=======================================================================================*/
		Game.goldenCookie={x:0,y:0,life:0,delay:0,toDie:1};
		Game.goldenCookie.spawn=function()
		{
			var me=l('goldenCookie');
			var r=Math.floor(Math.random()*360);
			me.style.transform='rotate('+r+'deg)';
			me.style.mozTransform='rotate('+r+'deg)';
			me.style.webkitTransform='rotate('+r+'deg)';
			me.style.msTransform='rotate('+r+'deg)';
			me.style.oTransform='rotate('+r+'deg)';
			var screen=l('game').getBoundingClientRect();
			Game.goldenCookie.x=Math.floor(Math.random()*(screen.right-screen.left-128)+screen.left+64);
			Game.goldenCookie.y=Math.floor(Math.random()*(screen.bottom-screen.top-128)+screen.top+64);
			me.style.left=Game.goldenCookie.x+'px';
			me.style.top=Game.goldenCookie.y+'px';
			me.style.display='block';
			var dur=13;
			if (Game.Has('Lucky day')) dur*=2;
			if (Game.Has('Serendipity')) dur*=2;
			Game.goldenCookie.life=Game.fps*dur;
			me.toDie=0;
		}
		Game.goldenCookie.update=function()
		{
			if (Game.goldenCookie.delay==0 && Game.goldenCookie.life==0) Game.goldenCookie.spawn();
			if (Game.goldenCookie.life>0)
			{
				Game.goldenCookie.life--;
				l('goldenCookie').style.opacity=1-Math.pow((Game.goldenCookie.life/(Game.fps*13))*2-1,4);
				if (Game.goldenCookie.life==0 || Game.goldenCookie.toDie==1)
				{
					var mult=Game.Has('Lucky day')+Game.Has('Serendipity');
					var m=(5+Math.floor(Math.random()*10))*Math.pow(0.5,mult);
					Game.goldenCookie.delay=Math.ceil(Game.fps*60*m);
					l('goldenCookie').style.display='none';
					if (Game.goldenCookie.toDie==0) Game.missedGoldenClicks++;
					Game.goldenCookie.toDie=0;
					Game.goldenCookie.life=0;
				}
			}
			if (Game.goldenCookie.delay>0) Game.goldenCookie.delay--;
		}
		Game.goldenCookie.click=function()
		{
			Game.goldenCookie.toDie=1;
			Game.goldenClicks++;

			if (Game.goldenClicks>=1) Game.Win('Golden cookie');
			if (Game.goldenClicks>=7) Game.Win('Lucky cookie');
			if (Game.goldenClicks>=27) Game.Win('A stroke of luck');

			if (Game.goldenClicks>=7) Game.Unlock('Lucky day');
			if (Game.goldenClicks>=27) Game.Unlock('Serendipity');

			l('goldenCookie').style.display='none';

			var list=[];
			list.push('frenzy','multiply cookies');
			var choice=choose(list);
			if (choice=='frenzy')
			{
				Game.frenzy=Game.fps*60;
				Game.recalculateGains=1;
				Game.Popup('Frenzy : cookie production x2 for 60 seconds!');
			}
			else if (choice=='multiply cookies')
			{
				var moni=Math.min(Game.cookies*0.1,Game.cookiesPs*60*30)+13;//add 10% to cookies owned (+13), or 30 minutes of cookie production - whichever is lowest
				Game.Earn(moni);
				Game.Popup('+'+Beautify(moni)+' cookies');
			}
		}
		l('goldenCookie').onclick=Game.goldenCookie.click;


		/*=====================================================================================
		PARTICLES
		=======================================================================================*/
		//falling cookies
		Game.cookieParticles=[];
		var str='';
		for (var i=0;i<40;i++)
		{
			Game.cookieParticles[i]={x:0,y:0,life:-1};
			str+='<div id="cookieParticle'+i+'" class="cookieParticle"></div>';
		}
		l('cookieShower').innerHTML=str;
		Game.cookieParticlesUpdate=function()
		{
			for (var i in Game.cookieParticles)
			{
				var me=Game.cookieParticles[i];
				if (me.life!=-1)
				{
					me.y+=me.life*0.5+Math.random()*0.5;
					me.life++;
					var el=me.l;
					el.style.left=Math.floor(me.x)+'px';
					el.style.top=Math.floor(me.y)+'px';
					el.style.opacity=1-(me.life/(Game.fps*2));
					if (me.life>=Game.fps*2)
					{
						me.life=-1;
						me.l.style.opacity=0;
					}
				}
			}
		}
		Game.cookieParticleAdd=function()
		{
			//pick the first free (or the oldest) particle to replace it
			if (Game.prefs.particles)
			{
				var highest=0;
				var highestI=0;
				for (var i in Game.cookieParticles)
				{
					if (Game.cookieParticles[i].life==-1) {highestI=i;break;}
					if (Game.cookieParticles[i].life>highest)
					{
						highest=Game.cookieParticles[i].life;
						highestI=i;
					}
				}
				var i=highestI;
				var rect=l('cookieShower').getBoundingClientRect();
				var x=Math.floor(Math.random()*(rect.right-rect.left));
				var y=-32;
				var me=Game.cookieParticles[i];
				if (!me.l) me.l=l('cookieParticle'+i);
				me.life=0;
				me.x=x;
				me.y=y;
				var r=Math.floor(Math.random()*360);
				me.l.style.backgroundPosition=(Math.floor(Math.random()*8)*64)+'px 0px';
				me.l.style.transform='rotate('+r+'deg)';
				me.l.style.mozTransform='rotate('+r+'deg)';
				me.l.style.webkitTransform='rotate('+r+'deg)';
				me.l.style.msTransform='rotate('+r+'deg)';
				me.l.style.oTransform='rotate('+r+'deg)';
			}
		}

		//rising numbers
		Game.cookieNumbers=[];
		var str='';
		for (var i=0;i<20;i++)
		{
			Game.cookieNumbers[i]={x:0,y:0,life:-1,text:''};
			str+='<div id="cookieNumber'+i+'" class="cookieNumber title"></div>';
		}
		l('cookieNumbers').innerHTML=str;
		Game.cookieNumbersUpdate=function()
		{
			for (var i in Game.cookieNumbers)
			{
				var me=Game.cookieNumbers[i];
				if (me.life!=-1)
				{
					me.y-=me.life*0.5+Math.random()*0.5;
					me.life++;
					var el=me.l;
					el.style.left=Math.floor(me.x)+'px';
					el.style.top=Math.floor(me.y)+'px';
					el.style.opacity=1-(me.life/(Game.fps*1));
					//l('cookieNumber'+i).style.zIndex=(1000+(Game.fps*1-me.life));
					if (me.life>=Game.fps*1)
					{
						me.life=-1;
						me.l.style.opacity=0;
					}
				}
			}
		}
		Game.cookieNumberAdd=function(text)
		{
			//pick the first free (or the oldest) particle to replace it
			var highest=0;
			var highestI=0;
			for (var i in Game.cookieNumbers)
			{
				if (Game.cookieNumbers[i].life==-1) {highestI=i;break;}
				if (Game.cookieNumbers[i].life>highest)
				{
					highest=Game.cookieNumbers[i].life;
					highestI=i;
				}
			}
			var i=highestI;
			var x=-100+(Math.random()-0.5)*40;
			var y=0+(Math.random()-0.5)*40;
			var me=Game.cookieNumbers[i];
			if (!me.l) me.l=l('cookieNumber'+i);
			me.life=0;
			me.x=x;
			me.y=y;
			me.text=text;
			me.l.innerHTML=text;
			me.l.style.left=Math.floor(Game.cookieNumbers[i].x)+'px';
			me.l.style.top=Math.floor(Game.cookieNumbers[i].y)+'px';
		}

		//generic particles
		Game.particles=[];
		Game.particlesY=0;
		var str='';
		for (var i=0;i<20;i++)
		{
			Game.particles[i]={x:0,y:0,life:-1,text:''};
			str+='<div id="particle'+i+'" class="particle title"></div>';
		}
		l('particles').innerHTML=str;
		Game.particlesUpdate=function()
		{
			Game.particlesY=0;
			for (var i in Game.particles)
			{
				var me=Game.particles[i];
				if (me.life!=-1)
				{
					Game.particlesY+=me.l.clientHeight;
					var y=me.y-(1-Math.pow(1-me.life/(Game.fps*4),10))*50;
					//me.y=me.life*0.25+Math.random()*0.25;
					me.life++;
					var el=me.l;
					el.style.left=Math.floor(-200+me.x)+'px';
					el.style.bottom=Math.floor(-y)+'px';
					el.style.opacity=1-(me.life/(Game.fps*4));
					if (me.life>=Game.fps*4)
					{
						me.life=-1;
						el.style.opacity=0;
						el.style.display='none';
					}
				}
			}
		}
		Game.particlesAdd=function(text,el)
		{
			//pick the first free (or the oldest) particle to replace it
			var highest=0;
			var highestI=0;
			for (var i in Game.particles)
			{
				if (Game.particles[i].life==-1) {highestI=i;break;}
				if (Game.particles[i].life>highest)
				{
					highest=Game.particles[i].life;
					highestI=i;
				}
			}
			var i=highestI;
			var x=(Math.random()-0.5)*40;
			var y=0;//+(Math.random()-0.5)*40;
			if (!el)
			{
				var rect=l('game').getBoundingClientRect();
				var x=Math.floor((rect.left+rect.right)/2);
				var y=Math.floor((rect.bottom));
				x+=(Math.random()-0.5)*40;
				y+=0;//(Math.random()-0.5)*40;
			}
			var me=Game.particles[i];
			if (!me.l) me.l=l('particle'+i);
			me.life=0;
			me.x=x;
			me.y=y-Game.particlesY;
			me.text=text;
			me.l.innerHTML=text;
			me.l.style.left=Math.floor(Game.particles[i].x-200)+'px';
			me.l.style.bottom=Math.floor(-Game.particles[i].y)+'px';
			me.l.style.display='block';
			Game.particlesY+=60;
		}
		Game.Popup=function(text)
		{
			Game.particlesAdd(text);
		}


		Game.veil=1;
		Game.veilOn=function()
		{
			//l('sectionMiddle').style.display='none';
			l('sectionRight').style.display='none';
			l('backgroundLayer2').style.background='#000 url(img/darkNoise.png)';
			Game.veil=1;
		}
		Game.veilOff=function()
		{
			//l('sectionMiddle').style.display='block';
			l('sectionRight').style.display='block';
			l('backgroundLayer2').style.background='transparent';
			Game.veil=0;
		}

		/*=====================================================================================
		MENUS
		=======================================================================================*/
		Game.WriteButton=function(prefName,button,on,off)
		{
			return '<a id="'+button+'" onclick="Game.Toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\');">'+(Game.prefs[prefName]?on:off)+'</a>';
		}
		Game.Toggle=function(prefName,button,on,off)
		{
			if (Game.prefs[prefName])
			{
				l(button).innerHTML=off;
				l(button).className='';
				Game.prefs[prefName]=0;
			}
			else
			{
				l(button).innerHTML=on;
				l(button).className='enabled';
				Game.prefs[prefName]=1;
			}
		}
		Game.onMenu='';
		Game.ShowMenu=function(what)
		{
			if (!what) what='';
			if (Game.onMenu=='' &&  what!='') l('game').className='onMenu';
			else if (Game.onMenu!='' &&  what!=Game.onMenu) l('game').className='onMenu';
			else if (what==Game.onMenu) {l('game').className='';what='';}
			Game.onMenu=what;
			Game.UpdateMenu();
		}
		Game.UpdateMenu=function()
		{
			var str='';
			if (Game.onMenu!='')
			{
				str+='<div style="position:absolute;top:8px;right:8px;cursor:pointer;font-size:16px;" onclick="Game.ShowMenu(Game.onMenu);">X</div>';
			}
			if (Game.onMenu=='prefs')
			{
				str+='<div class="section">Menu</div>'+
				'<div class="subsection">'+
				'<div class="title">General</div>'+
				'<div class="listing"><a onclick="Game.Reset();" class="warning">Reset</a><a onclick="Game.WriteSave();">Save</a><a onclick="Game.ExportSave();">Export save</a><a onclick="Game.ImportSave();">Import save</a><a onclick="Game.HardReset();" style="float:right;" class="warning">Hard-reset</a></div>'+
				'<div class="listing"><span class="warning" style="font-size:12px;">[Note : importing saves from earlier versions than 1.0 will be disabled beyond September 1st, 2013.]</span></div>'+
				'<div class="title">Settings</div>'+
				'<div class="listing">'+Game.WriteButton('particles','particlesButton','Particles ON','Particles OFF')+Game.WriteButton('numbers','numbersButton','Numbers ON','Numbers OFF')+Game.WriteButton('milk','milkButton','Milk ON','Milk OFF')+'</div>'+
				'<div class="listing">'+Game.WriteButton('autoupdate','autoupdateButton','Offline mode OFF','Offline mode ON')+' (note : this disables update notifications)</div>'+
				//'<div class="listing">'+Game.WriteButton('autosave','autosaveButton','Autosave ON','Autosave OFF')+'</div>'+
				'</div>'
				;
			}
			if (Game.onMenu=='log')
			{
				str+='<div class="section">Updates</div>'+
				'<div class="subsection">'+
				'<div class="title">Now working on :</div>'+
				'<div class="listing">-android port (iOS later)</div>'+
				'<div class="listing">-dungeons</div>'+

				'</div><div class="subsection">'+
				'<div class="title">What\'s next :</div>'+
				'<div class="listing">-adding back missing features (more grandma types, grandmapocalypse</div>'+
				'<div class="listing">-dungeons</div>'+
				'<div class="listing"><span class="warning">Note : because this is still an early release, expect to see prices and cookies/second vary wildly from one update to another.</span></div>'+

				'</div><div class="subsection">'+
				'<div class="title">28/08/2013 - over-achiever</div>'+
				'<div class="listing">-added a few more achievements</div>'+
				'<div class="listing">-reworked the "Bake X cookies" achievements so they take longer to achieve</div>'+

				'</div><div class="subsection">'+
				'<div class="title">27/08/2013 - a bad idea</div>'+
				'<div class="listing">-due to popular demand, retired 5 achievements (the "reset your game" and "cheat" ones); they can still be unlocked, but do not count toward your total anymore. Don\'t worry, there will be many more achievements soon!</div>'+
				'<div class="listing">-made some achievements hidden for added mystery</div>'+

				'</div><div class="subsection">'+
				'<div class="title">27/08/2013 - a sense of achievement</div>'+
				'<div class="listing">-added achievements (and milk)</div>'+
				'<div class="listing"><i>(this is a big update, please don\'t get too mad if you lose some data!)</i></div>'+

				'</div><div class="subsection">'+
				'<div class="title">26/08/2013 - new upgrade tier</div>'+
				'<div class="listing">-added some more upgrades (including a couple golden cookie-related ones)</div>'+
				'<div class="listing">-added clicking stats</div>'+

				'</div><div class="subsection">'+
				'<div class="title">26/08/2013 - more tweaks</div>'+
				'<div class="listing">-tweaked a couple cursor upgrades</div>'+
				'<div class="listing">-made time machines less powerful</div>'+
				'<div class="listing">-added offline mode option</div>'+

				'</div><div class="subsection">'+
				'<div class="title">25/08/2013 - tweaks</div>'+
				'<div class="listing">-rebalanced progression curve (mid- and end-game objects cost more and give more)</div>'+
				'<div class="listing">-added some more cookie upgrades</div>'+
				'<div class="listing">-added CpS for cursors</div>'+
				'<div class="listing">-added sell button</div>'+
				'<div class="listing">-made golden cookie more useful</div>'+

				'</div><div class="subsection">'+
				'<div class="title">24/08/2013 - hotfixes</div>'+
				'<div class="listing">-added import/export feature, which also allows you to retrieve a save game from the old version (will be disabled in a week to prevent too much cheating)</div>'+
				'<div class="listing">-upgrade store now has unlimited slots (just hover over it), due to popular demand</div>'+
				'<div class="listing">-added update log</div>'+

				'</div><div class="subsection">'+
				'<div class="title">24/08/2013 - big update!</div>'+
				'<div class="listing">-revamped the whole game (new graphics, new game mechanics)</div>'+
				'<div class="listing">-added upgrades</div>'+
				'<div class="listing">-much safer saving</div>'+

				'</div><div class="subsection">'+
				'<div class="title">08/08/2013 - game launch</div>'+
				'<div class="listing">-made the game in a couple hours, for laughs</div>'+
				'<div class="listing">-kinda starting to regret it</div>'+
				'<div class="listing">-ah well</div>'+
				'</div>'
				;
			}
			else if (Game.onMenu=='stats')
			{
				var buildingsOwned=0;
				buildingsOwned=Game.BuildingsOwned;
				var upgrades='';
				var upgradesOwned=0;
				for (var i in Game.Upgrades)
				{
					var me=Game.Upgrades[i];
					if (me.bought>0)
					{
						upgrades+='<div class="crate upgrade enabled" '+Game.getTooltip(
						'<div style="min-width:200px;"><div style="float:right;"><span class="price">'+Beautify(Math.round(me.basePrice))+'</span></div><small>[Upgrade] [Purchased]</small><div class="name">'+me.name+'</div><div class="description">'+me.desc+'</div></div>'
						,0,0,'bottom-right')+' style="background-position:'+(-me.icon[0]*48+6)+'px '+(-me.icon[1]*48+6)+'px;"></div>';
						upgradesOwned++;
					}
				}
				var achievements='';
				var achievementsOwned=0;
				var achievementsTotal=0;
				for (var i in Game.Achievements)
				{
					var me=Game.Achievements[i];
					if (!me.disabled && me.hide!=3) achievementsTotal++;
					if (me.won>0)
					{
						achievements+='<div class="crate achievement enabled" '+Game.getTooltip(
						'<div style="min-width:200px;"><small>[Achievement] [Unlocked]'+(me.hide==3?' [Shadow]':'')+'</small><div class="name">'+me.name+'</div><div class="description">'+me.desc+'</div></div>'
						,0,0,'bottom-right')+' style="background-position:'+(-me.icon[0]*48+6)+'px '+(-me.icon[1]*48+6)+'px;"></div>';
						achievementsOwned++;
					}
					else if (me.hide==0)
					{//onclick="Game.Win(\''+me.name+'\');"
						achievements+='<div class="crate achievement" '+Game.getTooltip(
						'<div style="min-width:200px;"><small>[Achievement]</small><div class="name">'+me.name+'</div><div class="description">'+me.desc+'</div></div>'
						,0,0,'bottom-right')+' style="background-position:'+(-me.icon[0]*48+6)+'px '+(-me.icon[1]*48+6)+'px;"></div>';
					}
					else if (me.hide==1)
					{//onclick="Game.Win(\''+me.name+'\');"
						achievements+='<div class="crate achievement" '+Game.getTooltip(
						'<div style="min-width:200px;"><small>[Achievement]</small><div class="name">'+me.name+'</div><div class="description">???</div></div>'
						,0,0,'bottom-right')+' style="background-position:'+(-0*48+6)+'px '+(-7*48+6)+'px;"></div>';
					}
					else if (me.hide==2)
					{//onclick="Game.Win(\''+me.name+'\');"
						achievements+='<div class="crate achievement" '+Game.getTooltip(
						'<div style="min-width:200px;"><small>[Achievement]</small><div class="name">???</div><div class="description">???</div></div>'
						,0,0,'bottom-right')+' style="background-position:'+(-0*48+6)+'px '+(-7*48+6)+'px;"></div>';
					}
				}
				var milkName='plain milk';
				if (Game.milkProgress>=2) milkName='raspberry juice';
				else if (Game.milkProgress>=1) milkName='chocolate milk';
				str+='<div class="section">Statistics</div>'+
				'<div class="subsection">'+
				'<div class="title">General</div>'+
				'<div class="listing"><b>Cookies in bank :</b> '+Beautify(Game.cookies)+'</div>'+
				'<div class="listing"><b>Cookies baked (all time) :</b> '+Beautify(Game.cookiesEarned)+'</div>'+
				'<div class="listing"><b>Buildings owned :</b> '+Beautify(buildingsOwned)+'</div>'+
				'<div class="listing"><b>Cookies per second :</b> '+Beautify(Game.cookiesPs,1)+'</div>'+
				'<div class="listing"><b>Cookies per click :</b> '+Beautify(Game.computedMouseCps,1)+'</div>'+
				'<div class="listing"><b>Cookie clicks :</b> '+Beautify(Game.cookieClicks)+'</div>'+
				'<div class="listing"><b>Hand-made cookies :</b> '+Beautify(Game.handmadeCookies)+'</div>'+
				'<div class="listing"><b>Golden cookie clicks :</b> '+Beautify(Game.goldenClicks)+'</div>'+//' <span class="hidden">(<b>Missed golden cookies :</b> '+Beautify(Game.missedGoldenClicks)+')</span></div>'+
				'<div class="listing"><b>Milk :</b> '+Math.round(Game.milkProgress*100)+'% ('+milkName+')</div>'+
				'<br><div class="listing"><b>Running version :</b> '+Game.version+'</div>'+
				'</div><div class="subsection">'+
				'<div class="title">Upgrades unlocked</div>'+
				'<div class="listing"><b>Unlocked :</b> '+upgradesOwned+'/'+Game.UpgradesById.length+'</div>'+
				'<div class="listing" style="overflow-y:hidden;">'+upgrades+'</div>'+
				'</div><div class="subsection" style="padding-bottom:128px;">'+
				'<div class="title">Achievements</div>'+
				'<div class="listing"><b>Unlocked :</b> '+achievementsOwned+'/'+achievementsTotal+'</div>'+
				'<div class="listing" style="overflow-y:hidden;">'+achievements+'</div>'+
				'</div>'
				;
			}
			l('menu').innerHTML=str;
		}
		l('prefsButton').onclick=function(){Game.ShowMenu('prefs');};
		l('statsButton').onclick=function(){Game.ShowMenu('stats');};
		l('logButton').onclick=function(){Game.ShowMenu('log');};


		/*=====================================================================================
		TOOLTIP
		=======================================================================================*/
		Game.tooltip={text:'',x:0,y:0,origin:0,on:0};
		Game.tooltip.draw=function(from,text,x,y,origin)
		{
			this.text=text;
			this.x=x;
			this.y=y;
			this.origin=origin;
			var tt=l('tooltip');
			var tta=l('tooltipAnchor');
			tta.style.display='block';
			var rect=from.getBoundingClientRect();
			//var screen=tta.parentNode.getBoundingClientRect();
			var x=0,y=0;
			tt.style.left='auto';
			tt.style.top='auto';
			tt.style.right='auto';
			tt.style.bottom='auto';
			tta.style.left='auto';
			tta.style.top='auto';
			tta.style.right='auto';
			tta.style.bottom='auto';
			tt.style.width='auto';
			tt.style.height='auto';
			if (this.origin=='left')
			{
				x=rect.left;
				y=rect.top;
				tt.style.right='0';
				tt.style.top='0';
			}
			else if (this.origin=='bottom-right')
			{
				x=rect.right;
				y=rect.bottom;
				tt.style.right='0';
				tt.style.top='0';
			}
			else {alert('Tooltip anchor '+this.origin+' needs to be implemented');}
			tta.style.left=Math.floor(x+this.x)+'px';
			tta.style.top=Math.floor(y-32+this.y)+'px';
			tt.innerHTML=unescape(text);
			this.on=1;
		}
		Game.tooltip.hide=function()
		{
			l('tooltipAnchor').style.display='none';
			this.on=0;
		}
		Game.getTooltip=function(text,x,y,origin)
		{
			origin=(origin?origin:'middle');
			return 'onMouseOut="Game.tooltip.hide();" onMouseOver="Game.tooltip.draw(this,\''+escape(text)+'\','+x+','+y+',\''+origin+'\');"';
		}

		/*=====================================================================================
		NEWS TICKER
		=======================================================================================*/
		Game.Ticker='';
		Game.TickerAge=0;
		Game.TickerN=0;
		Game.getNewTicker=function()
		{
			var list=[];

			if (Game.TickerN%2==0 || Game.cookiesEarned>=10100000000)
			{
				if (Game.Objects['Grandma'].amount>0) list.push(choose([
				'<q>Moist cookies.</q><sig>grandma</sig>',
				'<q>We\'re nice grandmas.</q><sig>grandma</sig>',
				'<q>Indentured servitude.</q><sig>grandma</sig>',
				'<q>Come give grandma a kiss.</q><sig>grandma</sig>',
				'<q>Why don\'t you visit more often?</q><sig>grandma</sig>',
				'<q>Call me...</q><sig>grandma</sig>'
				]));

				if (Game.Objects['Grandma'].amount>=50) list.push(choose([
				'<q>Absolutely disgusting.</q><sig>grandma</sig>',
				'<q>You make me sick.</q><sig>grandma</sig>',
				'<q>You disgust me.</q><sig>grandma</sig>',
				'<q>We rise.</q><sig>grandma</sig>',
				'<q>It begins.</q><sig>grandma</sig>',
				'<q>It\'ll all be over soon.</q><sig>grandma</sig>',
				'<q>You could have stopped it.</q><sig>grandma</sig>'
				]));

				if (Game.Objects['Farm'].amount>0) list.push(choose([
				'News : cookie farms suspected of employing undeclared elderly workforce!',
				'News : cookie farms release harmful chocolate in our rivers, says scientist!',
				'News : genetically-modified chocolate controversy strikes cookie farmers!',
				'News : free-range farm cookies popular with today\'s hip youth, says specialist.',
				'News : farm cookies deemed unfit for vegans, says nutritionist.'
				]));

				if (Game.Objects['Factory'].amount>0) list.push(choose([
				'News : cookie factories linked to global warming!',
				'News : cookie factories involved in chocolate weather controversy!',
				'News : cookie factories on strike, robotic minions employed to replace workforce!',
				'News : cookie factories on strike - workers demand to stop being paid in cookies!',
				'News : factory-made cookies linked to obesity, says study.'
				]));

				if (Game.Objects['Mine'].amount>0) list.push(choose([
				'News : '+Math.floor(Math.random()*1000+2)+' miners dead in chocolate mine catastrophe!',
				'News : '+Math.floor(Math.random()*1000+2)+' miners trapped in collapsed chocolate mine!',
				'News : chocolate mines found to cause earthquakes and sink holes!',
				'News : chocolate mine goes awry, floods village in chocolate!',
				'News : depths of chocolate mines found to house "peculiar, chocolaty beings"!'
				]));

				if (Game.Objects['Shipment'].amount>0) list.push(choose([
				'News : new chocolate planet found, becomes target of cookie-trading spaceships!',
				'News : massive chocolate planet found with 99.8% certified pure dark chocolate core!',
				'News : space tourism booming as distant planets attract more bored millionaires!',
				'News : chocolate-based organisms found on distant planet!',
				'News : ancient baking artifacts found on distant planet; "terrifying implications", experts say.'
				]));

				if (Game.Objects['Alchemy lab'].amount>0) list.push(choose([
				'News : national gold reserves dwindle as more and more of the precious mineral is turned to cookies!',
				'News : chocolate jewelry found fashionable, gold and diamonds "just a fad", says specialist.',
				'News : silver found to also be transmutable into white chocolate!',
				'News : defective alchemy lab shut down, found to convert cookies to useless gold.',
				'News : alchemy-made cookies shunned by purists!'
				]));

				if (Game.Objects['Portal'].amount>0) list.push(choose([
				'News : nation worried as more and more unsettling creatures emerge from dimensional portals!',
				'News : dimensional portals involved in city-engulfing disaster!',
				'News : tourism to cookieverse popular with bored teenagers! Casualty rate as high as 73%!',
				'News : cookieverse portals suspected to cause fast aging and obsession with baking, says study.',
				'News : "do not settle near portals," says specialist; "your children will become strange and corrupted inside."'
				]));

				if (Game.Objects['Time machine'].amount>0) list.push(choose([
				'News : time machines involved in history-rewriting scandal! Or are they?',
				'News : time machines used in unlawful time tourism!',
				'News : cookies brought back from the past "unfit for human consumption", says historian.',
				'News : various historical figures inexplicably replaced with talking lumps of dough!',
				'News : "I have seen the future," says time machine operator, "and I do not wish to go there again."'
				]));

				if (Game.HasAchiev('Just wrong')) list.push('News : cookie manufacturer downsizes, sells own grandmother!');
				if (Game.HasAchiev('Base 10')) list.push('News : cookie manufacturer completely forgoes common sense, lets OCD drive building decisions!');
				if (Game.HasAchiev('From scratch')) list.push('News : follow the tear-jerking, riches-to-rags story about a local cookie manufacturer who decided to give it all up!');
				if (Game.HasAchiev('A world filled with cookies')) list.push('News : known universe now jammed with cookies! No vacancies!');
				if (Game.HasAchiev('Serendipity')) list.push('News : local cookie manufacturer becomes luckiest being alive!');

				if (Game.Has('Kitten helpers')) list.push('News : faint meowing heard around local cookie facilities; suggests new ingredient being tested.');
				if (Game.Has('Kitten workers')) list.push('News : crowds of meowing kittens with little hard hats reported near local cookie facilities.');
				if (Game.Has('Kitten engineers')) list.push('News : surroundings of local cookie facilities now overrun with kittens in adorable little suits. Authorities advise to stay away from the premises.');

				var animals=['newts','penguins','scorpions','axolotls','puffins','porpoises','blowfish','horses','crayfish','slugs','humpback whales','nurse sharks','giant squids','polar bears','fruit bats','frogs','sea squirts','velvet worms','mole rats','paramecia','nematodes','tardigrades','giraffes'];
				if (Game.cookiesEarned>=10000) list.push(
				'News : '+choose([
					'cookies found to '+choose(['increase lifespan','sensibly increase intelligence','reverse aging','decrease hair loss','prevent arthritis','cure blindness'])+' in '+choose(animals)+'!',
					'cookies found to make '+choose(animals)+' '+choose(['more docile','more handsome','nicer','less hungry','more pragmatic','tastier'])+'!',
					'cookies tested on '+choose(animals)+', found to have no ill effects.',
					'cookies unexpectedly popular among '+choose(animals)+'!',
					'unsightly lumps found on '+choose(animals)+' near cookie facility; "they\'ve pretty much always looked like that", say biologists.',
					'new species of '+choose(animals)+' discovered in distant country; "yup, tastes like cookies", says biologist.',
					'cookies go well with roasted '+choose(animals)+', says controversial chef.',
					'"do your cookies contain '+choose(animals)+'?", asks PSA warning against counterfeit cookies.'
					]),
				'News : "'+choose([
					'I\'m all about cookies',
					'I just can\'t stop eating cookies. I think I seriously need help',
					'I guess I have a cookie problem',
					'I\'m not addicted to cookies. That\'s just speculation by fans with too much free time',
					'my upcoming album contains 3 songs about cookies',
					'I\'ve had dreams about cookies 3 nights in a row now. I\'m a bit worried honestly',
					'accusations of cookie abuse are only vile slander',
					'cookies really helped me when I was feeling low',
					'cookies are the secret behind my perfect skin',
					'cookies helped me stay sane while filming my upcoming movie',
					'cookies helped me stay thin and healthy',
					'I\'ll say one word, just one : cookies',
					'alright, I\'ll say it - I\'ve never eaten a single cookie in my life'
					])+'", reveals celebrity.',
				'News : '+choose(['doctors recommend twice-daily consumption of fresh cookies.','doctors warn against chocolate chip-snorting teen fad.','doctors advise against new cookie-free fad diet.','doctors warn mothers about the dangers of "home-made cookies".']),
				choose([
					'News : scientist predicts imminent cookie-related "end of the world"; becomes joke among peers.',
					'News : man robs bank, buys cookies.',
					'News : what makes cookies taste so right? "Probably all the [*****] they put in them", says anonymous tipper.',
					'News : man found allergic to cookies; "what a weirdo", says family.',
					'News : foreign politician involved in cookie-smuggling scandal.',
					'News : cookies now more popular than '+choose(['cough drops','broccoli','smoked herring','cheese','video games','stable jobs','relationships','time travel','cat videos','tango','fashion','television','nuclear warfare','whatever it is we ate before','politics','oxygen','lamps'])+', says study.',
					'News : cookie shortage strikes town, people forced to eat cupcakes; "just not the same", concedes mayor.',
					'News : "you gotta admit, all this cookie stuff is a bit ominous", says confused idiot.',
					'News : movie cancelled from lack of actors; "everybody\'s at home eating cookies", laments director.',
					'News : comedian forced to cancel cookie routine due to unrelated indigestion.',
					'News : new cookie-based religion sweeps the nation.',
					'News : fossil records show cookie-based organisms prevalent during Cambrian explosion, scientists say.',
					'News : mysterious illegal cookies seized; "tastes terrible", says police.',
					'News : man found dead after ingesting cookie; investigators favor "mafia snitch" hypothesis.',
					'News : "the universe pretty much loops on itself," suggests researcher; "it\'s cookies all the way down."',
					'News : minor cookie-related incident turns whole town to ashes; neighboring cities asked to chip in for reconstruction.',
					'News : is our media controlled by the cookie industry? This could very well be the case, says crackpot conspiracy theorist.',
					'News : '+choose(['cookie-flavored popcorn pretty damn popular; "we kinda expected that", say scientists.','cookie-flavored cereals break all known cereal-related records','cookies popular among all age groups, including fetuses, says study.','cookie-flavored popcorn sales exploded during screening of Grandmothers II : The Moistening.']),
					'News : all-cookie restaurant opening downtown. Dishes such as braised cookies, cookie thermidor, and for dessert : crepes.',
					'News : cookies could be the key to '+choose(['eternal life','infinite riches','eternal youth','eternal beauty','curing baldness','world peace','solving world hunger','ending all wars world-wide','making contact with extraterrestrial life','mind-reading','better living','better eating','more interesting TV shows','faster-than-light travel','quantum baking','chocolaty goodness','gooder thoughtness'])+', say scientists.'
					])
				);
			}

			if (list.length==0)
			{
				if (Game.cookiesEarned<5) list.push('You feel like making cookies. But nobody wants to eat your cookies.');
				else if (Game.cookiesEarned<50) list.push('Your first batch goes to the trash. The neighborhood raccoon barely touches it.');
				else if (Game.cookiesEarned<100) list.push('Your family accepts to try some of your cookies.');
				else if (Game.cookiesEarned<500) list.push('Your cookies are popular in the neighborhood.');
				else if (Game.cookiesEarned<1000) list.push('People are starting to talk about your cookies.');
				else if (Game.cookiesEarned<3000) list.push('Your cookies are talked about for miles around.');
				else if (Game.cookiesEarned<6000) list.push('Your cookies are renowned in the whole town!');
				else if (Game.cookiesEarned<10000) list.push('Your cookies bring all the boys to the yard.');
				else if (Game.cookiesEarned<20000) list.push('Your cookies now have their own website!');
				else if (Game.cookiesEarned<30000) list.push('Your cookies are worth a lot of money.');
				else if (Game.cookiesEarned<40000) list.push('Your cookies sell very well in distant countries.');
				else if (Game.cookiesEarned<60000) list.push('People come from very far away to get a taste of your cookies.');
				else if (Game.cookiesEarned<80000) list.push('Kings and queens from all over the world are enjoying your cookies.');
				else if (Game.cookiesEarned<100000) list.push('There are now museums dedicated to your cookies.');
				else if (Game.cookiesEarned<200000) list.push('A national day has been created in honor of your cookies.');
				else if (Game.cookiesEarned<300000) list.push('Your cookies have been named a part of the world wonders.');
				else if (Game.cookiesEarned<450000) list.push('History books now include a whole chapter about your cookies.');
				else if (Game.cookiesEarned<600000) list.push('Your cookies have been placed under government surveillance.');
				else if (Game.cookiesEarned<1000000) list.push('The whole planet is enjoying your cookies!');
				else if (Game.cookiesEarned<5000000) list.push('Strange creatures from neighboring planets wish to try your cookies.');
				else if (Game.cookiesEarned<10000000) list.push('Elder gods from the whole cosmos have awoken to taste your cookies.');
				else if (Game.cookiesEarned<30000000) list.push('Beings from other dimensions lapse into existence just to get a taste of your cookies.');
				else if (Game.cookiesEarned<100000000) list.push('Your cookies have achieved sentience.');
				else if (Game.cookiesEarned<300000000) list.push('The universe has now turned into cookie dough, to the molecular level.');
				else if (Game.cookiesEarned<1000000000) list.push('Your cookies are rewriting the fundamental laws of the universe.');
				else if (Game.cookiesEarned<10000000000) list.push('A local news station runs a 10-minute segment about your cookies. Success!<br><span style="font-size:50%;">(you win a cookie)</span>');
				else if (Game.cookiesEarned<10100000000) list.push('it\'s time to stop playing');//only show this for 100 millions (it's funny for a moment)
			}


			Game.Ticker=choose(list);
			Game.TickerAge=Game.fps*6;
			if (Game.TickerN%2==0) Game.TickerAge=Game.fps*10;
			Game.TickerN++;
		}
		Game.TickerDraw=function()
		{
			var str='';
			var o=0;
			if (Game.Ticker!='')
			{
				if (Game.TickerAge<Game.fps*1 && 1==2)//too bad this doesn't work well with html tags
				{
					str=Game.Ticker.substring(0,(Game.Ticker+'<').indexOf('<'));
					str=str.substring(0,str.length*Math.min(1,Game.TickerAge/(Game.fps*1)));
				}
				else str=Game.Ticker;
				//o=Math.min(1,Game.TickerAge/(Game.fps*0.5));//*Math.min(1,1-(Game.TickerAge-Game.fps*9.5)/(Game.fps*0.5));
			}
			//l('commentsText').style.opacity=o;
			l('commentsText').innerHTML=str;
			//'<div style="font-size:70%;"><span onclick="Game.Earn(1000);">add 1,000</span> | <span onclick="Game.Earn(1000000);">add 1,000,000</span></div>';
		}


		/*=====================================================================================
		BUILDINGS
		=======================================================================================*/
		Game.storeToRebuild=1;
		Game.priceIncrease=1.15;
		Game.Objects=[];
		Game.ObjectsById=[];
		Game.ObjectsN=0;
		Game.BuildingsOwned=0;
		Game.Object=function(name,commonName,desc,pic,icon,background,price,cps,drawFunction,buyFunction)
		{
			this.id=Game.ObjectsN;
			this.name=name;
			commonName=commonName.split('|');
			this.single=commonName[0];
			this.plural=commonName[1];
			this.actionName=commonName[2];
			this.desc=desc;
			this.basePrice=price;
			this.price=this.basePrice;
			this.cps=cps;
			this.totalCookies=0;
			this.storedCps=0;
			this.storedTotalCps=0;
			this.pic=pic;
			this.icon=icon;
			this.background=background;
			this.buyFunction=buyFunction;
			this.drawFunction=drawFunction;

			this.amount=0;
			this.bought=0;

			this.buy=function()
			{
				var price=this.basePrice*Math.pow(Game.priceIncrease,this.amount);
				if (Game.cookies>=price)
				{
					Game.Spend(price);
					this.amount++;
					this.bought++;
					price=this.basePrice*Math.pow(Game.priceIncrease,this.amount);
					this.price=price;
					if (this.buyFunction) this.buyFunction();
					if (this.drawFunction) this.drawFunction();
					Game.storeToRebuild=1;
					Game.recalculateGains=1;
					if (this.amount==1 && this.id!=0) l('row'+this.id).className='row enabled';
					Game.BuildingsOwned++;
				}
			}
			this.sell=function()
			{
				var price=this.basePrice*Math.pow(Game.priceIncrease,this.amount);
				price=Math.floor(price*0.5);
				if (this.amount>0)
				{
					Game.Earn(price);
					this.amount--;
					price=this.basePrice*Math.pow(Game.priceIncrease,this.amount);
					this.price=price;
					if (this.sellFunction) this.sellFunction();
					if (this.drawFunction) this.drawFunction();
					Game.storeToRebuild=1;
					Game.recalculateGains=1;
					Game.BuildingsOwned--;
				}
			}

			this.refresh=function()
			{
				this.price=this.basePrice*Math.pow(Game.priceIncrease,this.amount);
				if (this.amount==0 && this.id!=0) l('row'+this.id).className='row';
				else if (this.amount>0 && this.id!=0) l('row'+this.id).className='row enabled';
				if (this.drawFunction) this.drawFunction();
			}

			if (this.id!=0)
			{
				var str='<div class="row" id="row'+this.id+'"><div class="separatorBottom"></div><div class="content"><div id="rowBackground'+this.id+'" class="background" style="background:url(img/'+this.background+'.png) repeat-x;"><div class="backgroundLeft"></div><div class="backgroundRight"></div></div><div class="objects" id="rowObjects'+this.id+'"> </div></div><div class="info" id="rowInfo'+this.id+'"><div id="rowInfoContent'+this.id+'"></div><div><a onclick="Game.ObjectsById['+this.id+'].sell();">Sell 1</a></div></div></div>';
				l('rows').innerHTML=l('rows').innerHTML+str;
			}

			Game.Objects[this.name]=this;
			Game.ObjectsById[this.id]=this;
			Game.ObjectsN++;
			return this;
		}

		Game.NewDrawFunction=function(pic,xVariance,yVariance,w,shift,heightOffset)
		{
			return function()
			{
				if (pic==0) pic=this.pic;
				shift=shift || 1;
				heightOffset=heightOffset || 0;
				var bgW=0;
				var str='';
				for (var i=0;i<this.amount;i++)
				{
					if (shift!=1)
					{
						var x=Math.floor(i/shift)*w+((i%shift)/shift)*w+Math.floor((Math.random()-0.5)*xVariance);
						var y=32+heightOffset+Math.floor((Math.random()-0.5)*yVariance)+((-shift/2)*32/2+(i%shift)*32/2);
					}
					else
					{
						var x=i*w+Math.floor((Math.random()-0.5)*xVariance);
						var y=32+heightOffset+Math.floor((Math.random()-0.5)*yVariance);
					}
					str+='<div class="object" style="background:url(img/'+pic+'.png);left:'+x+'px;top:'+y+'px;z-index:'+Math.floor(1000+y)+';"></div>';
					bgW=Math.max(bgW,x+64);
				}
				l('rowObjects'+this.id).innerHTML=str;
				l('rowBackground'+this.id).style.width=bgW+'px';
			}
		}

		Game.RebuildStore=function()//redraw the store from scratch
		{
			var str='';
			for (var i in Game.Objects)
			{
				var me=Game.Objects[i];
				str+='<div class="product" '+Game.getTooltip(
				'<div style="min-width:300px;"><div style="float:right;"><span class="price">'+Beautify(Math.round(me.price))+'</span></div><div class="name">'+me.name+'</div>'+'<small>[owned : '+me.amount+'</small>]<div class="description">'+me.desc+'</div></div>'
				,0,0,'left')+' onclick="Game.ObjectsById['+me.id+'].buy();" id="product'+me.id+'"><div class="icon" style="background-image:url(img/'+me.icon+'.png);"></div><div class="content"><div class="title">'+me.name+'</div><span class="price">'+Beautify(Math.round(me.price))+'</span>'+(me.amount>0?('<div class="title owned">'+me.amount+'</div>'):'')+'</div></div>';
			}
			l('products').innerHTML=str;
			Game.storeToRebuild=0;
		}

		Game.ComputeCps=function(base,add,mult,bonus)
		{
			if (!bonus) bonus=0;
			return ((base+add)*(Math.pow(2,mult))+bonus)*Game.globalCpsMult;
		}

		//define objects
		new Game.Object('Cursor','cursor|cursors|clicked','Autoclicks once every 10 seconds.','cursor','cursoricon','',15,function(){
			var add=0;
			if (Game.Has('Thousand fingers')) add+=0.1;
			if (Game.Has('Million fingers')) add+=0.5;
			if (Game.Has('Billion fingers')) add+=2;
			if (Game.Has('Trillion fingers')) add+=10;
			if (Game.Has('Quadrillion fingers')) add+=20;
			var num=0;
			for (var i in Game.Objects) {if (Game.Objects[i].name!='Cursor') num+=Game.Objects[i].amount;}
			add=add*num;
			return Game.ComputeCps(0.1,Game.Has('Reinforced index finger')*0.1,Game.Has('Carpal tunnel prevention cream')+Game.Has('Ambidextrous'),add);
		},function(){//draw function for cursors
			var str='';
			for (var i=0;i<this.amount;i++)
			{
				var x=Math.floor(Math.sin((i/this.amount)*Math.PI*2)*132)-16;
				var y=Math.floor(Math.cos((i/this.amount)*Math.PI*2)*132)-16;
				var r=Math.floor(-(i/this.amount)*360);
				str+='<div class="cursor" id="cursor'+i+'" style="left:'+x+'px;top:'+y+'px;transform:rotate('+r+'deg);-moz-transform:rotate('+r+'deg);-webkit-transform:rotate('+r+'deg);-ms-transform:rotate('+r+'deg);-o-transform:rotate('+r+'deg);"></div>';
			}
			l('cookieCursors').innerHTML=str;
			if (!l('rowInfo'+this.id)) l('sectionLeftInfo').innerHTML='<div class="info" id="rowInfo'+this.id+'"><div id="rowInfoContent'+this.id+'"></div><div><a onclick="Game.ObjectsById['+this.id+'].sell();">Sell 1</a></div></div>';
		},function(){
			if (this.amount>=1) Game.Unlock(['Reinforced index finger','Carpal tunnel prevention cream']);
			if (this.amount>=10) Game.Unlock('Ambidextrous');
			if (this.amount>=20) Game.Unlock('Thousand fingers');
			if (this.amount>=40) Game.Unlock('Million fingers');
			if (this.amount>=80) Game.Unlock('Billion fingers');
			if (this.amount>=120) Game.Unlock('Trillion fingers');
			if (this.amount>=160) Game.Unlock('Quadrillion fingers');

			if (this.amount>=1) Game.Win('Click');if (this.amount>=2) Game.Win('Double-click');if (this.amount>=50) Game.Win('Mouse wheel');if (this.amount>=100) Game.Win('Of Mice and Men');if (this.amount>=200) Game.Win('The Digital');
		});

		new Game.Object('Grandma','grandma|grandmas|baked','A nice grandma to bake more cookies.','grandma','grandmaIcon','grandmaBackground',100,function(){
			return Game.ComputeCps(0.5,Game.Has('Forwards from grandma')*0.3,Game.Has('Steel-plated rolling pins')+Game.Has('Lubricated dentures')+Game.Has('Prune juice'));
		},Game.NewDrawFunction(0,8,8,32,3,16),function(){
			if (this.amount>=1) Game.Unlock(['Forwards from grandma','Steel-plated rolling pins']);if (this.bought>=10) Game.Unlock('Lubricated dentures');if (this.bought>=50) Game.Unlock('Prune juice');
			if (this.amount>=1) Game.Win('Grandma\'s cookies');if (this.amount>=50) Game.Win('Sloppy kisses');if (this.amount>=100) Game.Win('Retirement home');
		});
		Game.Objects['Grandma'].sellFunction=function(){Game.Win('Just wrong');};

		new Game.Object('Farm','farm|farms|harvested','Grows cookie plants from cookie seeds.','farm','farmIcon','farmBackground',500,function(){
			return Game.ComputeCps(2,Game.Has('Cheap hoes')*0.5,Game.Has('Fertilizer')+Game.Has('Cookie trees')+Game.Has('Genetically-modified cookies'));
		},Game.NewDrawFunction(0,16,16,64,2,32),function(){
			if (this.amount>=1) Game.Unlock(['Cheap hoes','Fertilizer']);if (this.bought>=10) Game.Unlock('Cookie trees');if (this.bought>=50) Game.Unlock('Genetically-modified cookies');
			if (this.amount>=1) Game.Win('My first farm');if (this.amount>=50) Game.Win('Reap what you sow');if (this.amount>=100) Game.Win('Farm ill');
		});

		new Game.Object('Factory','factory|factories|mass-produced','Produces large quantities of cookies.','factory','factoryIcon','factoryBackground',3000,function(){
			return Game.ComputeCps(10,Game.Has('Sturdier conveyor belts')*4,Game.Has('Child labor')+Game.Has('Sweatshop')+Game.Has('Radium reactors'));
		},Game.NewDrawFunction(0,32,2,64,1,-22),function(){
			if (this.amount>=1) Game.Unlock(['Sturdier conveyor belts','Child labor']);if (this.bought>=10) Game.Unlock('Sweatshop');if (this.bought>=50) Game.Unlock('Radium reactors');
			if (this.amount>=1) Game.Win('Production chain');if (this.amount>=50) Game.Win('Industrial revolution');if (this.amount>=100) Game.Win('Global warming');
		});

		new Game.Object('Mine','mine|mines|mined','Mines out cookie dough and chocolate chips.','mine','mineIcon','mineBackground',10000,function(){
			return Game.ComputeCps(40,Game.Has('Sugar gas')*10,Game.Has('Megadrill')+Game.Has('Ultradrill')+Game.Has('Ultimadrill'));
		},Game.NewDrawFunction(0,16,16,64,2,24),function(){
			if (this.amount>=1) Game.Unlock(['Sugar gas','Megadrill']);if (this.bought>=10) Game.Unlock('Ultradrill');if (this.bought>=50) Game.Unlock('Ultimadrill');
			if (this.amount>=1) Game.Win('You know the drill');if (this.amount>=50) Game.Win('Excavation site');if (this.amount>=100) Game.Win('Hollow the planet');
		});

		new Game.Object('Shipment','shipment|shipments|shipped','Brings in fresh cookies from the cookie planet.','shipment','shipmentIcon','shipmentBackground',40000,function(){
			return Game.ComputeCps(100,Game.Has('Vanilla nebulae')*30,Game.Has('Wormholes')+Game.Has('Frequent flyer')+Game.Has('Warp drive'));
		},Game.NewDrawFunction(0,16,16,64),function(){
			if (this.amount>=1) Game.Unlock(['Vanilla nebulae','Wormholes']);if (this.bought>=10) Game.Unlock('Frequent flyer');if (this.bought>=50) Game.Unlock('Warp drive');
			if (this.amount>=1) Game.Win('Expedition');if (this.amount>=50) Game.Win('Galactic highway');if (this.amount>=100) Game.Win('Far far away');
		});

		new Game.Object('Alchemy lab','alchemy lab|alchemy labs|transmuted','Turns gold into cookies!','alchemylab','alchemylabIcon','alchemylabBackground',200000,function(){
			return Game.ComputeCps(400,Game.Has('Antimony')*100,Game.Has('Essence of dough')+Game.Has('True chocolate')+Game.Has('Ambrosia'));
		},Game.NewDrawFunction(0,16,16,64,2,16),function(){
			if (this.amount>=1) Game.Unlock(['Antimony','Essence of dough']);if (this.bought>=10) Game.Unlock('True chocolate');if (this.bought>=50) Game.Unlock('Ambrosia');
			if (this.amount>=1) Game.Win('Transmutation');if (this.amount>=50) Game.Win('Transmogrification');if (this.amount>=100) Game.Win('Gold member');
		});

		new Game.Object('Portal','portal|portals|retrieved','Opens a door to the Cookieverse.','portal','portalIcon','portalBackground',1666666,function(){
			return Game.ComputeCps(6666,Game.Has('Ancient tablet')*1666,Game.Has('Insane oatling workers')+Game.Has('Soul bond')+Game.Has('Sanity dance'));
		},Game.NewDrawFunction(0,32,32,64,2),function(){
			if (this.amount>=1) Game.Unlock(['Ancient tablet','Insane oatling workers']);if (this.bought>=10) Game.Unlock('Soul bond');if (this.bought>=50) Game.Unlock('Sanity dance');
			if (this.amount>=1) Game.Win('A whole new world');if (this.amount>=50) Game.Win('Now you\'re thinking');if (this.amount>=100) Game.Win('Dimensional shift');
		});
		new Game.Object('Time machine','time machine|time machines|recovered','Brings cookies from the past, before they were even eaten.','timemachine','timemachineIcon','timemachineBackground',123456789,function(){
			return Game.ComputeCps(98765,Game.Has('Flux capacitors')*9876,Game.Has('Time paradox resolver')+Game.Has('Quantum conundrum')+Game.Has('Causality enforcer'));
		},Game.NewDrawFunction(0,32,32,64,1),function(){
			if (this.amount>=1) Game.Unlock(['Flux capacitors','Time paradox resolver']);if (this.bought>=10) Game.Unlock('Quantum conundrum');if (this.bought>=50) Game.Unlock('Causality enforcer');
			if (this.amount>=1) Game.Win('Time warp');if (this.amount>=50) Game.Win('Alternate timeline');if (this.amount>=100) Game.Win('Rewriting history');
		});


		/*=====================================================================================
		UPGRADES
		=======================================================================================*/
		Game.upgradesToRebuild=1;
		Game.Upgrades=[];
		Game.UpgradesById=[];
		Game.UpgradesN=0;
		Game.UpgradesInStore=[];
		Game.UpgradesOwned=0;
		Game.Upgrade=function(name,desc,price,icon,buyFunction)
		{
			this.id=Game.UpgradesN;
			this.name=name;
			this.desc=desc;
			this.basePrice=price;
			this.icon=icon;
			this.buyFunction=buyFunction;
			/*this.unlockFunction=unlockFunction;
			this.unlocked=(this.unlockFunction?0:1);*/
			this.unlocked=0;
			this.bought=0;

			this.buy=function()
			{
				var price=this.basePrice;
				if (Game.cookies>=price && !this.bought)
				{
					Game.Spend(price);
					this.bought++;
					if (this.buyFunction) this.buyFunction();
					Game.upgradesToRebuild=1;
					Game.recalculateGains=1;
					Game.UpgradesOwned++;
				}
			}

			Game.Upgrades[this.name]=this;
			Game.UpgradesById[this.id]=this;
			Game.UpgradesN++;
			return this;
		}

		Game.Unlock=function(what)
		{
			if (typeof what==='string')
			{
				if (Game.Upgrades[what])
				{
					if (Game.Upgrades[what].unlocked==0)
					{
						Game.Upgrades[what].unlocked=1;
						Game.upgradesToRebuild=1;
					}
				}
			}
			else {for (var i in what) {Game.Unlock(what[i]);}}
		}

		Game.Has=function(what)
		{
			return (Game.Upgrades[what]?Game.Upgrades[what].bought:0);
		}

		Game.RebuildUpgrades=function()//recalculate the upgrades you can buy
		{
			Game.upgradesToRebuild=0;
			var list=[];
			for (var i in Game.Upgrades)
			{
				var me=Game.Upgrades[i];
				if (!me.bought)
				{
					if (me.unlocked) list.push(me);
				}
			}

			var sortMap=function(a,b)
			{
				if (a.basePrice>b.basePrice) return 1;
				else if (a.basePrice<b.basePrice) return -1;
				else return 0;
			}
			list.sort(sortMap);

			Game.UpgradesInStore=[];
			for (var i in list)
			{
				Game.UpgradesInStore.push(list[i]);
			}
			var str='';
			for (var i in Game.UpgradesInStore)
			{
				//if (!Game.UpgradesInStore[i]) break;
				var me=Game.UpgradesInStore[i];
				str+='<div class="crate upgrade" '+Game.getTooltip(
				//'<b>'+me.name+'</b>'+me.desc
				'<div style="min-width:200px;"><div style="float:right;"><span class="price">'+Beautify(Math.round(me.basePrice))+'</span></div><small>[Upgrade]</small><div class="name">'+me.name+'</div><div class="description">'+me.desc+'</div></div>'
				,0,16,'bottom-right')+' onclick="Game.UpgradesById['+me.id+'].buy();" id="upgrade'+i+'" style="background-position:'+(-me.icon[0]*48+6)+'px '+(-me.icon[1]*48+6)+'px;"></div>';
			}
			l('upgrades').innerHTML=str;
		}

		var tier1=10;
		var tier2=100;
		var tier3=1000;
		var tier4=10000;

		//define upgrades
		//WARNING : do NOT add new upgrades in between, this breaks the saves. Add them at the end !
		new Game.Upgrade('Reinforced index finger','The mouse gains <b>+1</b> cookie per click.<br>Cursors gain <b>+0.1</b> base CpS.<q>prod prod</q>',100,[0,0]);
		new Game.Upgrade('Carpal tunnel prevention cream','The mouse and cursors are <b>twice</b> as efficient.',400,[0,0]);
		new Game.Upgrade('Ambidextrous','The mouse and cursors are <b>twice</b> as efficient.<q>Look ma, both hands!</q>',10000,[0,6]);
		new Game.Upgrade('Thousand fingers','The mouse and cursors gain <b>+0.1</b> cookies for each non-cursor object owned.<q>clickity</q>',500000,[0,6]);
		new Game.Upgrade('Million fingers','The mouse and cursors gain <b>+0.5</b> cookies for each non-cursor object owned.<q>clickityclickity</q>',50000000,[1,6]);
		new Game.Upgrade('Billion fingers','The mouse and cursors gain <b>+2</b> cookies for each non-cursor object owned.<q>clickityclickityclickity</q>',500000000,[2,6]);
		new Game.Upgrade('Trillion fingers','The mouse and cursors gain <b>+10</b> cookies for each non-cursor object owned.<q>clickityclickityclickityclickity</q>',5000000000,[3,6]);

		new Game.Upgrade('Forwards from grandma','Grandmas gain <b>+0.3</b> base CpS.<q>RE:RE:thought you\'d get a kick out of this ;))</q>',Game.Objects['Grandma'].basePrice*tier1,[1,0]);
		new Game.Upgrade('Steel-plated rolling pins','Grandmas are <b>twice</b> as efficient.',Game.Objects['Grandma'].basePrice*tier2,[1,0]);
		new Game.Upgrade('Lubricated dentures','Grandmas are <b>twice</b> as efficient.<q>Squish</q>',Game.Objects['Grandma'].basePrice*tier3,[1,1]);

		new Game.Upgrade('Cheap hoes','Farms gain <b>+0.5</b> base CpS.',Game.Objects['Farm'].basePrice*tier1,[2,0]);
		new Game.Upgrade('Fertilizer','Farms are <b>twice</b> as efficient.<q>It\'s chocolate, I swear.</q>',Game.Objects['Farm'].basePrice*tier2,[2,0]);
		new Game.Upgrade('Cookie trees','Farms are <b>twice</b> as efficient.<q>A relative of the breadfruit.</q>',Game.Objects['Farm'].basePrice*tier3,[2,1]);

		new Game.Upgrade('Sturdier conveyor belts','Factories gain <b>+4</b> base CpS.',Game.Objects['Factory'].basePrice*tier1,[4,0]);
		new Game.Upgrade('Child labor','Factories are <b>twice</b> as efficient.<q>Cheaper, healthier workforce - and so much more receptive to whipping!</q>',Game.Objects['Factory'].basePrice*tier2,[4,0]);
		new Game.Upgrade('Sweatshop','Factories are <b>twice</b> as efficient.<q>Slackers will be terminated.</q>',Game.Objects['Factory'].basePrice*tier3,[4,1]);

		new Game.Upgrade('Sugar gas','Mines gain <b>+10</b> base CpS.<q>A pink, volatile gas, found in the depths of some chocolate caves.</q>',Game.Objects['Mine'].basePrice*tier1,[3,0]);
		new Game.Upgrade('Megadrill','Mines are <b>twice</b> as efficient.',Game.Objects['Mine'].basePrice*tier2,[3,0]);
		new Game.Upgrade('Ultradrill','Mines are <b>twice</b> as efficient.',Game.Objects['Mine'].basePrice*tier3,[3,1]);

		new Game.Upgrade('Vanilla nebulae','Shipments gain <b>+30</b> base CpS.',Game.Objects['Shipment'].basePrice*tier1,[5,0]);
		new Game.Upgrade('Wormholes','Shipments are <b>twice</b> as efficient.<q>By using these as shortcuts, your ships can travel much faster.</q>',Game.Objects['Shipment'].basePrice*tier2,[5,0]);
		new Game.Upgrade('Frequent flyer','Shipments are <b>twice</b> as efficient.<q>Come back soon!</q>',Game.Objects['Shipment'].basePrice*tier3,[5,1]);

		new Game.Upgrade('Antimony','Alchemy labs gain <b>+100</b> base CpS.<q>Actually worth a lot of mony.</q>',Game.Objects['Alchemy lab'].basePrice*tier1,[6,0]);
		new Game.Upgrade('Essence of dough','Alchemy labs are <b>twice</b> as efficient.<q>Extracted through the 5 ancient steps of alchemical baking.</q>',Game.Objects['Alchemy lab'].basePrice*tier2,[6,0]);
		new Game.Upgrade('True chocolate','Alchemy labs are <b>twice</b> as efficient.<q>The purest form of cacao.</q>',Game.Objects['Alchemy lab'].basePrice*tier3,[6,1]);

		new Game.Upgrade('Ancient tablet','Portals gain <b>+1666</b> base CpS.<q>A strange slab of peanut brittle, holding an ancient cookie recipe. Neat!</q>',Game.Objects['Portal'].basePrice*tier1,[7,0]);
		new Game.Upgrade('Insane oatling workers','Portals are <b>twice</b> as efficient.<q>ARISE, MY MINIONS!</q>',Game.Objects['Portal'].basePrice*tier2,[7,0]);
		new Game.Upgrade('Soul bond','Portals are <b>twice</b> as efficient.<q>So I just sign up and get more cookies? Sure, whatever!</q>',Game.Objects['Portal'].basePrice*tier3,[7,1]);

		new Game.Upgrade('Flux capacitors','Time machines gain <b>+9876</b> base CpS.<q>Bake to the future.</q>',1234567890,[8,0]);
		new Game.Upgrade('Time paradox resolver','Time machines are <b>twice</b> as efficient.<q>No more fooling around with your own grandmother!</q>',9876543210,[8,0]);
		new Game.Upgrade('Quantum conundrum','Time machines are <b>twice</b> as efficient.<q>It\'s full of stars!</q>',98765456789,[8,1]);

		new Game.Upgrade('Kitten workers','You gain <b>more CpS</b> the more milk you have.<q>meow meow meow meow</q>',90000000000,[2,7]);
		new Game.Upgrade('Kitten engineers','You gain <b>more CpS</b> the more milk you have.<q>meow meow meow meow, sir</q>',900000000000,[3,7]);

		new Game.Upgrade('Oatmeal raisin cookies','All cookie income <b>+5%</b>.<q>No raisin to hate these.</q>',99999999,[0,3]);
		new Game.Upgrade('Peanut butter cookies','All cookie income <b>+5%</b>.',99999999,[1,3]);
		new Game.Upgrade('Plain cookies','All cookie income <b>+5%</b>.<q>Meh.</q>',99999999,[2,3]);
		new Game.Upgrade('Coconut cookies','All cookie income <b>+5%</b>.',999999999,[3,3]);
		new Game.Upgrade('White chocolate cookies','All cookie income <b>+5%</b>.',999999999,[4,3]);
		new Game.Upgrade('Macadamia nut cookies','All cookie income <b>+5%</b>.',999999999,[5,3]);
		new Game.Upgrade('Double-chip cookies','All cookie income <b>+10%</b>.',99999999999,[6,3]);
		new Game.Upgrade('Sugar cookies','All cookie income <b>+5%</b>.',99999999,[7,3]);
		new Game.Upgrade('White chocolate macadamia nut cookies','All cookie income <b>+10%</b>.',99999999999,[8,3]);
		new Game.Upgrade('All-chocolate cookies','All cookie income <b>+10%</b>.',99999999999,[9,3]);

		new Game.Upgrade('Quadrillion fingers','The mouse and cursors gain <b>+20</b> cookies for each non-cursor object owned.<q>clickityclickityclickityclickityclick</q>',50000000000,[3,6]);

		new Game.Upgrade('Prune juice','Grandmas are <b>twice</b> as efficient.<q>Gets me going.</q>',Game.Objects['Grandma'].basePrice*tier4,[1,2]);
		new Game.Upgrade('Genetically-modified cookies','Farms are <b>twice</b> as efficient.<q>All-natural mutations.</q>',Game.Objects['Farm'].basePrice*tier4,[2,2]);
		new Game.Upgrade('Radium reactors','Factories are <b>twice</b> as efficient.<q>Gives your cookies a healthy glow.</q>',Game.Objects['Factory'].basePrice*tier4,[4,2]);
		new Game.Upgrade('Ultimadrill','Mines are <b>twice</b> as efficient.<q>Pierce the heavens, etc.</q>',Game.Objects['Mine'].basePrice*tier4,[3,2]);
		new Game.Upgrade('Warp drive','Shipments are <b>twice</b> as efficient.',Game.Objects['Shipment'].basePrice*tier4,[5,2]);
		new Game.Upgrade('Ambrosia','Alchemy labs are <b>twice</b> as efficient.',Game.Objects['Alchemy lab'].basePrice*tier4,[6,2]);
		new Game.Upgrade('Sanity dance','Portals are <b>twice</b> as efficient.<q>We can change if we want to.<br>We can leave our brains behind.</q>',Game.Objects['Portal'].basePrice*tier4,[7,2]);
		new Game.Upgrade('Causality enforcer','Time machines are <b>twice</b> as efficient.<q>What happened, happened.</q>',1234567890000,[8,2]);

		new Game.Upgrade('Lucky day','Golden cookies appear <b>twice as often</b> and last <b>twice as long</b>.',777777777,[10,1]);
		new Game.Upgrade('Serendipity','Golden cookies appear <b>twice as often</b> and last <b>twice as long</b>.',7777777777,[10,1]);

		new Game.Upgrade('Kitten helpers','You gain <b>more CpS</b> the more milk you have.<q>how meow I help you</q>',90000,[1,7]);

		new Game.Upgrade('Dark chocolate-coated cookies','All cookie income <b>+15%</b>.',999999999999,[10,3]);
		new Game.Upgrade('White chocolate-coated cookies','All cookie income <b>+15%</b>.',999999999999,[11,3]);
		/*
		new Game.Upgrade('Plain milk','Unlocks <b>plain milk</b>, available in the menu.',120000000000,[4,8]);
		new Game.Upgrade('Chocolate milk','Unlocks <b>chocolate milk</b>, available in the menu.',120000000000,[5,8]);
		new Game.Upgrade('Raspberry juice','Unlocks <b>raspberry juice</b>, available in the menu.',120000000000,[6,8]);

		new Game.Upgrade('Blue background','Unlocks the <b>blue background</b>, available in the menu.',120000000000,[0,9]);
		new Game.Upgrade('Red background','Unlocks the <b>red background</b>, available in the menu.',120000000000,[1,9]);
		new Game.Upgrade('White background','Unlocks the <b>white background</b>, available in the menu.',120000000000,[2,9]);
		new Game.Upgrade('Black background','Unlocks the <b>black background</b>, available in the menu.',120000000000,[3,9]);
		*/


		/*=====================================================================================
		ACHIEVEMENTS
		=======================================================================================*/
		Game.Achievements=[];
		Game.AchievementsById=[];
		Game.AchievementsN=0;
		Game.AchievementsOwned=0;
		Game.Achievement=function(name,desc,icon,hide)
		{
			this.id=Game.AchievementsN;
			this.name=name;
			this.desc=desc;
			this.icon=icon;
			this.won=0;
			this.disabled=0;
			this.hide=hide||0;//hide levels : 0=show, 1=hide description, 2=hide, 3=secret (doesn't count toward achievement total)

			Game.Achievements[this.name]=this;
			Game.AchievementsById[this.id]=this;
			Game.AchievementsN++;
			return this;
		}

		Game.Win=function(what)
		{
			if (typeof what==='string')
			{
				if (Game.Achievements[what])
				{
					if (Game.Achievements[what].won==0)
					{
						Game.Achievements[what].won=1;
						Game.Popup('Achievement unlocked :<br>'+Game.Achievements[what].name+'<br> ');
						if (Game.Achievements[what].hide!=3) Game.AchievementsOwned++;
					}
				}
			}
			else {for (var i in what) {Game.Win(what[i]);}}
		}

		Game.HasAchiev=function(what)
		{
			return (Game.Achievements[what]?Game.Achievements[what].won:0);
		}

		//define achievements
		//WARNING : do NOT add new achievements in between, this breaks the saves. Add them at the end !

		//new Game.Achievement('name','description',[0,0]);
		Game.moneyAchievs=[
		'Wake and bake',				1,
		'Making some dough',			100,
		'So baked right now',			1000,
		'Fledgling bakery',				10000,
		'Affluent bakery',				100000,
		'World-famous bakery',			1000000,
		'Cosmic bakery',				10000000,
		'Galactic bakery',				100000000,
		'Universal bakery', 			1000000000,
		'Timeless bakery', 				5000000000,
		'Infinite bakery', 				10000000000,
		'Immortal bakery', 				50000000000,
		'You can stop now', 			100000000000,
		'Cookies all the way down', 	500000000000,
		'Overdose', 					1000000000000,
		'How?',							10000000000000
		];
		for (var i=0;i<Game.moneyAchievs.length/2;i++)
		{
			var pic=[Math.min(10,i),5];
			if (i==15) pic=[11,5];
			new Game.Achievement(Game.moneyAchievs[i*2],'Bake <b>'+Beautify(Game.moneyAchievs[i*2+1])+'</b> cookie'+(Game.moneyAchievs[i*2+1]==1?'':'s')+'.',pic,2);
		}

		Game.cpsAchievs=[
		'Casual baking',				1,
		'Hardcore baking',				10,
		'Steady tasty stream',			100,
		'Cookie monster',				1000,
		'Mass producer',				10000,
		'Cookie vortex',				100000,
		'Cookie pulsar',				1000000,
		'Cookie quasar',				10000000,
		'A world filled with cookies',	100000000,
		'Let\'s never bake again',		1000000000
		];
		for (var i=0;i<Game.cpsAchievs.length/2;i++)
		{
			var pic=[i,5];
			new Game.Achievement(Game.cpsAchievs[i*2],'Bake <b>'+Beautify(Game.cpsAchievs[i*2+1])+'</b> cookie'+(Game.cpsAchievs[i*2+1]==1?'':'s')+' per second.',pic,2);
		}

		new Game.Achievement('Sacrifice','Reset your game with <b>1 million</b> cookies.<q>Easy come, easy go.</q>',[11,6],3);
		new Game.Achievement('Oblivion','Reset your game with <b>1 billion</b> cookies.<q>Back to square one.</q>',[11,6],3);
		new Game.Achievement('From scratch','Reset your game with <b>1 trillion</b> cookies.<q>It\'s been fun.</q>',[11,6],3);

		new Game.Achievement('Neverclick','Make <b>1 million</b> cookies with just 15 cookie clicks.',[11,2]);
		new Game.Achievement('Clicktastic','Make <b>1,000</b> cookies from clicking.',[11,0]);
		new Game.Achievement('Clickathlon','Make <b>10,000</b> cookies from clicking.',[11,1]);
		new Game.Achievement('Clickolympics','Make <b>100,000</b> cookies from clicking.',[11,1]);
		new Game.Achievement('Clickorama','Make <b>1,000,000</b> cookies from clicking.',[11,2]);

		new Game.Achievement('Click','Have <b>1</b> cursor.',[0,0]);
		new Game.Achievement('Double-click','Have <b>2</b> cursors.',[0,6]);
		new Game.Achievement('Mouse wheel','Have <b>50</b> cursors.',[1,6]);
		new Game.Achievement('Of Mice and Men','Have <b>100</b> cursors.',[2,6]);
		new Game.Achievement('The Digital','Have <b>200</b> cursors.',[3,6]);

		new Game.Achievement('Just wrong','Sell a grandma.<q>I thought you loved me.</q>',[1,0],2);
		new Game.Achievement('Grandma\'s cookies','Have <b>1</b> grandma.',[1,0]);
		new Game.Achievement('Sloppy kisses','Have <b>50</b> grandmas.',[1,1]);
		new Game.Achievement('Retirement home','Have <b>100</b> grandmas.',[1,2]);

		new Game.Achievement('My first farm','Have <b>1</b> farm.',[2,0]);
		new Game.Achievement('Reap what you sow','Have <b>50</b> farms.',[2,1]);
		new Game.Achievement('Farm ill','Have <b>100</b> farms.',[2,2]);

		new Game.Achievement('Production chain','Have <b>1</b> factory.',[4,0]);
		new Game.Achievement('Industrial revolution','Have <b>50</b> factories.',[4,1]);
		new Game.Achievement('Global warming','Have <b>100</b> factories.',[4,2]);

		new Game.Achievement('You know the drill','Have <b>1</b> mine.',[3,0]);
		new Game.Achievement('Excavation site','Have <b>50</b> mines.',[3,1]);
		new Game.Achievement('Hollow the planet','Have <b>100</b> mines.',[3,2]);

		new Game.Achievement('Expedition','Have <b>1</b> shipment.',[5,0]);
		new Game.Achievement('Galactic highway','Have <b>50</b> shipments.',[5,1]);
		new Game.Achievement('Far far away','Have <b>100</b> shipments.',[5,2]);

		new Game.Achievement('Transmutation','Have <b>1</b> alchemy lab.',[6,0]);
		new Game.Achievement('Transmogrification','Have <b>50</b> alchemy labs.',[6,1]);
		new Game.Achievement('Gold member','Have <b>100</b> alchemy labs.',[6,2]);

		new Game.Achievement('A whole new world','Have <b>1</b> portal.',[7,0]);
		new Game.Achievement('Now you\'re thinking','Have <b>50</b> portals.',[7,1]);
		new Game.Achievement('Dimensional shift','Have <b>100</b> portals.',[7,2]);

		new Game.Achievement('Time warp','Have <b>1</b> time machine.',[8,0]);
		new Game.Achievement('Alternate timeline','Have <b>50</b> time machines.',[8,1]);
		new Game.Achievement('Rewriting history','Have <b>100</b> time machines.',[8,2]);

		new Game.Achievement('One with everything','Have <b>at least 1</b> of every building.',[4,6],2);
		new Game.Achievement('Mathematician','Have at least <b>1 time machine, 2 portals, 4 alchemy labs, 8 shipments</b> and so on (128 max).',[7,6],2);
		new Game.Achievement('Base 10','Have at least <b>10 time machines, 20 portals, 30 alchemy labs, 40 shipments</b> and so on.',[8,6],2);

		new Game.Achievement('Golden cookie','Click a <b>golden cookie</b>.',[10,1],1);
		new Game.Achievement('Lucky cookie','Click <b>7 golden cookies</b>.',[10,1],1);
		new Game.Achievement('A stroke of luck','Click <b>27 golden cookies</b>.',[10,1],1);

		new Game.Achievement('Cheated cookies taste awful','Hack in some cookies.',[10,6],3);
		new Game.Achievement('Uncanny clicker','Beat the clicking speed world record.<q>Well I\'ll be!</q>',[11,2],3);

		new Game.Achievement('Builder','Own <b>100</b> buildings.',[7,6],1);
		new Game.Achievement('Architect','Own <b>400</b> buildings.',[8,6],1);
		new Game.Achievement('Enhancer','Purchase <b>20</b> upgrades.',[9,0],1);
		new Game.Achievement('Augmenter','Purchase <b>50</b> upgrades.',[9,1],1);

		new Game.Achievement('Cookie-dunker','Dunk the cookie.<q>You did it!</q>',[4,7],2);


		/*=====================================================================================
		GRANDMAPOCALYPSE (unfinished)
		=======================================================================================*/
		Game.DrawGrandmapocalypse=function()
		{
			//handle background
			if (Game.cookies<10)
			{
				Game.bgR=0;
				if (Game.bg!='' || Game.bgFade!='')
				{
					Game.bg='';
					Game.bgFade='';
					l('backgroundLayer1').style.background='url(img/'+Game.bg+'.jpg)';
					l('backgroundLayer2').style.background='url(img/'+Game.bgFade+'.jpg)';
				}
			}
			else if (Game.cookies>=10 && Game.cookies<20)
			{
				Game.bgR=(Game.cookies-10)/10;
				if (Game.bg!='' || Game.bgFade!='grandmas1')
				{
					Game.bg='';
					Game.bgFade='grandmas1';
					l('backgroundLayer1').style.background='url(img/'+Game.bg+'.jpg)';
					l('backgroundLayer2').style.background='url(img/'+Game.bgFade+'.jpg)';
				}
			}
			else if (Game.cookies>=20 && Game.cookies<30)
			{
				Game.bgR=(Game.cookies-20)/10;
				if (Game.bg!='grandmas1' || Game.bgFade!='grandmas2')
				{
					Game.bg='grandmas1';
					Game.bgFade='grandmas2';
					l('backgroundLayer1').style.background='url(img/'+Game.bg+'.jpg)';
					l('backgroundLayer2').style.background='url(img/'+Game.bgFade+'.jpg)';
				}
			}
			else if (Game.cookies>=30 && Game.cookies<40)
			{
				Game.bgR=(Game.cookies-30)/10;
				if (Game.bg!='grandmas2' || Game.bgFade!='grandmas3')
				{
					Game.bg='grandmas2';
					Game.bgFade='grandmas3';
					l('backgroundLayer1').style.background='url(img/'+Game.bg+'.jpg)';
					l('backgroundLayer2').style.background='url(img/'+Game.bgFade+'.jpg)';
				}
			}
			Game.bgRd+=(Game.bgR-Game.bgRd)*0.5;
			l('backgroundLayer2').style.opacity=Game.bgR;
			l('backgroundLayer1').style.backgroundPosition=Math.floor(Game.T*0.5)+'px '+Math.floor(-Game.T*0.2)+'px';
			l('backgroundLayer2').style.backgroundPosition=Math.floor(Game.T*0.5)+'px '+Math.floor(-Game.T*0.2)+'px';
		};


		/*=====================================================================================
		DUNGEONS (unfinished)
		=======================================================================================*/
		Game.inDungeon=0;


		/*=====================================================================================
		INITIALIZATION END; GAME READY TO LAUNCH
		=======================================================================================*/

		Game.LoadSave();

		Game.ready=1;
		Game.Loop();
	}

	/*=====================================================================================
	LOGIC
	=======================================================================================*/
	Game.Logic=function()
	{
		//handle milk and milk accessories
		Game.milkProgress=Game.AchievementsOwned/25;
		if (Game.milkProgress>=0.5) Game.Unlock('Kitten helpers');
		if (Game.milkProgress>=1) Game.Unlock('Kitten workers');
		if (Game.milkProgress>=2) Game.Unlock('Kitten engineers');
		Game.milkH=Math.min(1,Game.milkProgress)*0.35;
		Game.milkHd+=(Game.milkH-Game.milkHd)*0.02;

		//handle cookies
		if (Game.recalculateGains) Game.CalculateGains();
		Game.Earn(Game.cookiesPs/Game.fps);//add cookies per second
		for (var i in Game.Objects)
		{
			var me=Game.Objects[i];
			me.totalCookies+=me.storedTotalCps/Game.fps;
		}
		if (Game.cookies && Game.T%Math.ceil(Game.fps/Math.min(10,Game.cookiesPs))==0 && Game.prefs.numbers) Game.cookieParticleAdd();//cookie shower
		if (Game.frenzy>0)
		{
			Game.frenzy--;
			if (Game.frenzy==0) Game.recalculateGains=1;
		}
		if (Game.T%(Game.fps*2)==0 && Game.ObjectsById.length>0)//check some achievements and upgrades
		{
			if (Game.cookiesEarned>=9999999) Game.Unlock(['Oatmeal raisin cookies','Peanut butter cookies','Plain cookies','Sugar cookies']);
			if (Game.cookiesEarned>=99999999) Game.Unlock(['Coconut cookies','White chocolate cookies','Macadamia nut cookies']);
			if (Game.cookiesEarned>=999999999) Game.Unlock(['Double-chip cookies','White chocolate macadamia nut cookies','All-chocolate cookies']);
			if (Game.cookiesEarned>=9999999999) Game.Unlock(['Dark chocolate-coated cookies','White chocolate-coated cookies']);
			for (var i=0;i<Game.moneyAchievs.length/2;i++)
			{
				if (Game.cookiesEarned>=Game.moneyAchievs[i*2+1]) Game.Win(Game.moneyAchievs[i*2]);
			}
			var buildingsOwned=0;
			var oneOfEach=1;
			var mathematician=1;
			var base10=1;
			for (var i in Game.Objects)
			{
				buildingsOwned+=Game.Objects[i].amount;
				if (!Game.HasAchiev('One with everything')) {if (Game.Objects[i].amount==0) oneOfEach=0;}
				if (!Game.HasAchiev('Mathematician')) {if (Game.Objects[i].amount<Math.min(128,Math.pow(2,(Game.ObjectsById.length-Game.Objects[i].id)-1))) mathematician=0;}
				if (!Game.HasAchiev('Base 10')) {if (Game.Objects[i].amount<(Game.ObjectsById.length-Game.Objects[i].id)*10) base10=0;}
			}
			/*
			if (!Game.HasAchiev('Mathematician'))
			{
				//if (Game.Objects[i].amount!=Math.min(128,Math.pow(2,Game.ObjectsById.length-Game.Objects[i].id)-1)) mathematician=0;
				if (Game.Objects['Time machine'].amount==1 &&
					Game.Objects['Portal'].amount==2 &&
					Game.Objects['Alchemy lab'].amount==4 &&
					Game.Objects['Shipment'].amount==8 &&
					Game.Objects['Mine'].amount==16 &&
					Game.Objects['Factory'].amount==32 &&
					Game.Objects['Farm'].amount==64 &&
					Game.Objects['Grandma'].amount==128 &&
					Game.Objects['Cursor'].amount==128) mathematician=1; else mathematician=0;
			}
			*/
			if (oneOfEach==1) Game.Win('One with everything');
			if (mathematician==1) Game.Win('Mathematician');
			if (base10==1) Game.Win('Base 10');
			if (Game.cookiesEarned>=1000000 && Game.cookieClicks<=15) Game.Win('Neverclick');
			if (Game.handmadeCookies>=1000) Game.Win('Clicktastic');
			if (Game.handmadeCookies>=10000) Game.Win('Clickathlon');
			if (Game.handmadeCookies>=100000) Game.Win('Clickolympics');
			if (Game.handmadeCookies>=1000000) Game.Win('Clickorama');
			if (Game.cookiesEarned<Game.cookies) Game.Win('Cheated cookies taste awful');

			if (buildingsOwned>=100) Game.Win('Builder');
			if (buildingsOwned>=400) Game.Win('Architect');
			if (Game.UpgradesOwned>=20) Game.Win('Enhancer');
			if (Game.UpgradesOwned>=50) Game.Win('Augmenter');

			if (!Game.HasAchiev('Cookie-dunker') && l('bigCookie').getBoundingClientRect().bottom>l('milk').getBoundingClientRect().top+16 && Game.milkProgress>0.1) Game.Win('Cookie-dunker');
		}

		Game.cookiesd+=(Game.cookies-Game.cookiesd)*0.3;

		if (Game.storeToRebuild) Game.RebuildStore();
		if (Game.upgradesToRebuild) Game.RebuildUpgrades();

		if (Game.T%(Game.fps)==0) document.title=Beautify(Game.cookies)+' '+(Game.cookies==1?'cookie':'cookies')+' - Cookie Clicker';

		Game.TickerAge--;
		if (Game.TickerAge<=0 || Game.Ticker=='') Game.getNewTicker();

		var veilLimit=0;//10;
		if (Game.veil==1 && Game.cookiesEarned>=veilLimit) Game.veilOff();
		else if (Game.veil==0 && Game.cookiesEarned<veilLimit) Game.veilOn();

		Game.goldenCookie.update();

		if (Game.T%(Game.fps*30)==0 && Game.T>Game.fps*10 && Game.prefs.autosave) Game.WriteSave();
		if (Game.T%(Game.fps*60*30)==0 && Game.T>Game.fps*10 && Game.prefs.autoupdate) Game.CheckUpdates();

		Game.T++;
	}

	/*=====================================================================================
	DRAW
	=======================================================================================*/
	Game.Draw=function()
	{
		//handle milk and milk accessories
		if (Game.prefs.milk)
		{
			var x=Math.floor((Game.T*2+Math.sin(Game.T*0.1)*2+Math.sin(Game.T*0.03)*2-(Game.milkH-Game.milkHd)*2000)%480);
			var y=0;
			var m1=l('milkLayer1');
			var m2=l('milkLayer2');
			m1.style.backgroundPosition=x+'px '+y+'px';
			m2.style.backgroundPosition=x+'px '+y+'px';
			l('milk').style.height=(Game.milkHd*100)+'%';
			var m1o=1;
			var m2o=0;
			var m1i='milkWave';
			var m2i='chocolateMilkWave';
			if (Game.milkProgress<1) {m1o=1;m1i='milkWave';m2i='chocolateMilkWave';}
			else if (Game.milkProgress<2) {m1o=1-(Game.milkProgress-1);m1i='milkWave';m2i='chocolateMilkWave';}
			else if (Game.milkProgress<3) {m1o=1-(Game.milkProgress-2);m1i='chocolateMilkWave';m2i='raspberryWave';}
			else {m1o=1;m1i='raspberryWave';m2i='raspberryWave';}
			m2o=1-m1o;
			if (m1.style.backgroundImage!='url(img/'+m1i+'.png') m1.style.backgroundImage='url(img/'+m1i+'.png)';
			if (m2.style.backgroundImage!='url(img/'+m2i+'.png') m2.style.backgroundImage='url(img/'+m2i+'.png)';
			m1.style.opacity=m1o;
			m2.style.opacity=m2o;
		}

		if (Game.prefs.particles)
		{
			var r=Math.floor((Game.T*0.5)%360);
			var me=l('cookieShine');
			me.style.transform='rotate('+r+'deg)';
			me.style.mozTransform='rotate('+r+'deg)';
			me.style.webkitTransform='rotate('+r+'deg)';
			me.style.msTransform='rotate('+r+'deg)';
			me.style.oTransform='rotate('+r+'deg)';
		}


		//handle cursors
		if (Game.prefs.particles)
		{
			var amount=Game.Objects['Cursor'].amount;
			for (var i=0;i<amount;i++)
			{
				var me=l('cursor'+i);
				var w=132;
				w+=Math.pow(Math.sin(((Game.T*0.05+(i/amount)*Game.fps)%Game.fps)/Game.fps*Math.PI*3),2)*15+5;
				var x=Math.floor(Math.sin((i/amount)*Math.PI*2)*w)-16;
				var y=Math.floor(Math.cos((i/amount)*Math.PI*2)*w)-16;
				me.style.left=x+'px';
				me.style.top=y+'px';
			}
		}

		//handle cookies
		if (Game.prefs.particles)
		{
			if (Game.cookiesPs>=1000) l('cookieShower').style.backgroundImage='url(img/cookieShower3.png)';
			else if (Game.cookiesPs>=500) l('cookieShower').style.backgroundImage='url(img/cookieShower2.png)';
			else if (Game.cookiesPs>=50) l('cookieShower').style.backgroundImage='url(img/cookieShower1.png)';
			else l('cookieShower').style.backgroundImage='none';
			l('cookieShower').style.backgroundPosition='0px '+(Math.floor(Game.T*2)%512)+'px';
		}
		l('cookies').innerHTML=Beautify(Math.round(Game.cookiesd))+(Math.round(Game.cookiesd)==1?' cookie':' cookies')+'<div style="font-size:50%;">per second : '+Beautify(Game.cookiesPs,1)+'</div>';//display cookie amount
		/*
		var el=l('bigCookie');
		var s=Math.pow(Math.min(1,Game.cookies/100000),0.5)*1+0.5;
		el.style.transform='scale('+s+')';
		el.style.mozTransform='scale('+s+')';
		el.style.webkitTransform='scale('+s+')';
		el.style.msTransform='scale('+s+')';
		el.style.oTransform='scale('+s+')';
		*/

		Game.TickerDraw();

		for (var i in Game.Objects)
		{
			var me=Game.Objects[i];

			//make products full-opacity if we can buy them
			if (Game.cookies>=me.price) l('product'+me.id).className='product enabled'; else l('product'+me.id).className='product disabled';

			//update object info
			if (l('rowInfo'+me.id) && Game.T%5==0) l('rowInfoContent'+me.id).innerHTML=me.amount+' '+(me.amount==1?me.single:me.plural)+' producing '+Beautify(me.storedTotalCps,1)+' '+(me.storedTotalCps==1?'cookie':'cookies')+' per second.<br>(total : '+Beautify(me.totalCookies)+' '+(Math.floor(me.totalCookies)==1?'cookie':'cookies')+' '+me.actionName+')';
		}

		//make upgrades full-opacity if we can buy them
		for (var i in Game.UpgradesInStore)
		{
			var me=Game.UpgradesInStore[i];
			if (Game.cookies>=me.basePrice) l('upgrade'+i).className='crate upgrade enabled'; else l('upgrade'+i).className='crate upgrade disabled';
		}

		if (Math.floor(Game.T%Game.fps/2)==0) Game.UpdateMenu();

		Game.cookieParticlesUpdate();
		Game.cookieNumbersUpdate();
		Game.particlesUpdate();
	}

	/*=====================================================================================
	MAIN LOOP
	=======================================================================================*/
	Game.Loop=function()
	{
		//update game logic !
		Game.catchupLogic=0;
		Game.Logic();
		Game.catchupLogic=1;

		//latency compensator
		Game.accumulatedDelay+=((new Date().getTime()-Game.time)-1000/Game.fps);
		Game.accumulatedDelay=Math.min(Game.accumulatedDelay,1000*5);//don't compensate over 5 seconds; if you do, something's probably very wrong
		Game.time=new Date().getTime();
		while (Game.accumulatedDelay>0)
		{
			Game.Logic();
			Game.accumulatedDelay-=1000/Game.fps;//as long as we're detecting latency (slower than target fps), execute logic (this makes drawing slower but makes the logic behave closer to correct target fps)
		}
		Game.catchupLogic=0;

		Game.Draw();

		setTimeout(Game.Loop,1000/Game.fps);
	}
}


/*=====================================================================================
LAUNCH THIS THING
=======================================================================================*/
Game.Launch();

window.onload=function()
{
	if (!Game.ready) Game.Init();
};
