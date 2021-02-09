
function eventFire(el, etype){
  if (el.fireEvent) {
    (el.fireEvent('on' + etype));
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function l(what) {return document.getElementById(what);}

Game=l('game');
Version=0.12;
Loaded=0;

Reset=function()
{
	ajax('backend.php?q=reset',ResetResponse);
}
ResetResponse=function()
{
	location.reload(true);
}

Save=function()
{
	var str='';
	str+=Version+'|'+Cookies+'|'+
	Cursors+'|'+Buyables['Cursor'].price+'|'+
	Grandmas+'|'+Buyables['Grandma'].price+'|'+
	Factories+'|'+Buyables['Factory'].price+'|'+
	Mines+'|'+Buyables['Mine'].price+'|'+
	Shipments+'|'+Buyables['Shipment'].price+'|'+
	Labs+'|'+Buyables['Alchemy lab'].price+'|'+
	Portals+'|'+Buyables['Portal'].price;

	ajax('backend.php?q=save|'+str,SaveResponse);
}

SaveResponse=function(response)
{
	var r=response.split('|');
	if (r[0]=='1' && parseFloat(r[1])>Version)
	{
		l('alert').style.visibility='visible';
		l('alert').innerHTML='New version available ('+r[1]+').<br>Please refresh to see it!';
	}
	new Pop('credits','Saved');
}

Load=function()
{
	ajax('backend.php?q=load',LoadResponse);
}

LoadResponse=function(response)
{
	var r=response.split('|');
	if (response!='0')
	{
		if (r[0]=='1')
		{
			Cookies=parseInt(r[2]);
			Cursors=parseInt(r[3]);Buyables['Cursor'].price=parseInt(r[4]);
			Grandmas=parseInt(r[5]);Buyables['Grandma'].price=parseInt(r[6]);
			Factories=parseInt(r[7]);Buyables['Factory'].price=parseInt(r[8]);
			Mines=parseInt(r[9]);Buyables['Mine'].price=parseInt(r[10]);
			Shipments=parseInt(r[11]);Buyables['Shipment'].price=parseInt(r[12]);
			Labs=parseInt(r[13]);Buyables['Alchemy lab'].price=parseInt(r[14]);
			if (r[15]) {Portals=parseInt(r[15]);Buyables['Portal'].price=parseInt(r[16]);}
			Buyables['Grandma'].func(0);
			Buyables['Factory'].func(0);
			Buyables['Mine'].func(0);
			Buyables['Shipment'].func(0);
			Buyables['Alchemy lab'].func(0);
			Buyables['Portal'].func(0);
			RebuildStore();
		}
	}
	new Pop('credits','Loaded.');
	Loaded=1;
	Main();
}

ClickCookie=function()
{
	if (Pops.length<100) new Pop('cookie','+1');
	Clicking=1;
	Cookies++;
}
HoverCookie=function()
{
	Hovering=1;
}

AddCookie=function(howmany,el)
{
	Cookies+=howmany;
	if (el && Pops.length<250) new Pop(el,'+'+howmany);
}



RebuildStore=function()
{
	var str='';
	for (var i in Buyables)
	{
		str+='<div id="buy'+Buyables[i].name+'" onclick="Buy(\''+Buyables[i].name+'\');" style="background-image:url('+Buyables[i].pic+'.png);"><b>'+Buyables[i].name+' - <moni></moni> '+Buyables[i].price+'</b>'+Buyables[i].desc+'</div>';
	}
	l('store').innerHTML=str;
}
Buyables=[];
Buyable=function(name,desc,pic,price,func)
{
	this.name=name;
	this.desc=desc;
	this.pic=pic;
	this.price=price;
	this.func=func;
	Buyables[name]=this;

	this.Buy=function()
	{
		if (Cookies>=this.price && Loaded)
		{
			Cookies-=this.price;
			this.price=Math.ceil(this.price*1.1);
			this.func(1);
			//Buyables[this.name]=0;
			RebuildStore();
		}
	}
	RebuildStore();
}
Buy=function(what)
{
	Buyables[what].Buy();
}

new Buyable('Cursor','Autoclicks every 5 seconds.','cursoricon',15,function(){Cursors++;});
new Buyable('Grandma','A nice grandma to bake more cookies.','grandmaicon',100,function(buy)
{
	if (buy) Grandmas++;
	var str='';
	for (var i=0;i<Grandmas;i++)
	{
		var x=Math.floor(Math.random()*20+(i%10)*24);
		var y=Math.floor(Math.random()*20+Math.floor(i/10)*24);
		str+='<div class="'+(Labs?'golden':'')+'grandma" style="left:'+x+'px;top:'+y+'px;"></div>';
	}
	l('grandmas').innerHTML=str;
});
new Buyable('Factory','Produces large quantities of cookies.','factoryicon',500,function(buy)
{
	if (buy) Factories++;
	var str='';
	for (var i=0;i<Factories;i++)
	{
		var x=Math.floor(Math.random()*20+(i%10)*32);
		var y=Math.floor(Math.random()*20+Math.floor(i/10)*24);
		str+='<div class="factory" style="right:'+x+'px;top:'+y+'px;"></div>';
	}
	l('factories').innerHTML=str;
});
new Buyable('Mine','Mines out cookie dough and chocolate chips.','mineicon',2000,function(buy)
{
	if (buy) Mines++;
	var str='';
	for (var i=0;i<Mines;i++)
	{
		var x=Math.floor(Math.random()*20+(i%10)*16);
		var y=Math.floor(Math.random()*20+Math.floor(i/10)*16);
		str+='<div class="mine" style="left:'+x+'px;top:'+y+'px;"></div>';
	}
	l('mines').innerHTML=str;
});
new Buyable('Shipment','Brings in fresh cookies from the cookie planet.','shipmenticon',7000,function(buy)
{
	if (buy) Shipments++;
	var str='';
	for (var i=0;i<Shipments;i++)
	{
		var x=Math.floor(Math.random()*20+(i%10)*24);
		var y=Math.floor(Math.random()*20+Math.floor(i/10)*24);
		str+='<div class="shipment" style="right:'+x+'px;top:'+y+'px;"></div>';
	}
	l('shipments').innerHTML=str;
});
new Buyable('Alchemy lab','Turns gold into cookies!','labicon',50000,function(buy)
{
	if (buy) Labs++;
	var str='';
	for (var i=0;i<Labs;i++)
	{
		var x=Math.floor(Math.random()*20+(i%10)*24);
		var y=Math.floor(Math.random()*20+Math.floor(i/10)*16);
		str+='<div class="lab" style="right:'+x+'px;top:'+y+'px;"></div>';
	}
	l('labs').innerHTML=str;
});
new Buyable('Portal','Opens a door to the Cookieverse.','portalicon',1000000,function(buy)
{
	if (buy) Portals++;
	var str='';
	for (var i=0;i<Portals;i++)
	{
		var x=Math.floor(Math.random()*20+(i%10)*24);
		var y=Math.floor(Math.random()*20+Math.floor(i/10)*24);
		str+='<div class="portal" style="right:'+x+'px;top:'+y+'px;"></div>';
	}
	l('portals').innerHTML=str;
});


Pops=[];
Pop=function(el,str)
{
	this.el=el;
	this.str=str;
	this.life=0;
	this.offx=Math.floor(Math.random()*20-10);
	this.offy=Math.floor(Math.random()*20-10);
	Pops.push(this);
}

Cookies=0;
CookiesDisplay=0;
Clicking=0;
Hovering=0;
T=0;

Cursors=0;
Grandmas=0;
Factories=0;
Mines=0;
Shipments=0;
Labs=0;
Portals=0;



Main=function()
{
	var str='';
	for (var i in Pops)
	{
		var rect=l(Pops[i].el).getBoundingClientRect();
		var x=Math.floor((rect.left+rect.right)/2+Pops[i].offx)-100;
		var y=Math.floor((rect.top+rect.bottom)/2-Math.pow(Pops[i].life/100,0.5)*100+Pops[i].offy)-10;
		var opacity=1-(Math.max(Pops[i].life,80)-80)/20;
		str+='<div class="pop" style="position:absolute;left:'+x+'px;top:'+y+'px;opacity:'+opacity+';">'+Pops[i].str+'</div>';
		Pops[i].life+=2;
		if (Pops[i].life>=100) Pops.splice(i,1);
	}
	l('pops').innerHTML=str;

	var str='';
	for (var i=0;i<Cursors;i++)
	{
		var rot=-Math.floor((360/Cursors)*i);
		var x=Math.floor(64+Math.sin((Math.PI*2/Cursors)*i)*64)-16;
		var y=Math.floor(64+Math.cos((Math.PI*2/Cursors)*i)*64)-16;
		if ((T)%150==Math.ceil((150/Cursors)*i)) y+=2;
		str+='<div class="cursor" style="left:'+x+'px;top:'+y+'px;transform:rotate('+rot+'deg);-webkit-transform:rotate('+rot+'deg);-moz-transform:rotate('+rot+'deg);-ms-transform:rotate('+rot+'deg);"></div>';
	}
	l('cookie').innerHTML=str;

	if (Portals && T%Math.ceil(150/Portals)==0) AddCookie(6666,'portals');
	if (Labs && T%Math.ceil(150/Labs)==0) AddCookie(500,'labs');
	if (Shipments && T%Math.ceil(150/Shipments)==0) AddCookie(100,'shipments');
	if (Mines && T%Math.ceil(150/Mines)==0) AddCookie(50,'mines');
	if (Factories && T%Math.ceil(150/Factories)==0) AddCookie(20,'factories');
	if (Grandmas && T%Math.ceil(150/Grandmas)==0) AddCookie((Labs?8:4),'grandmas');
	if (Cursors && T%Math.ceil(150/Cursors)==0) eventFire(l('cookie'),'mouseup');

	for (var i in Buyables)
	{
		if (Cookies>=Buyables[i].price) l('buy'+Buyables[i].name).className=''; else l('buy'+Buyables[i].name).className='grayed';
	}

	CookiesDisplay+=(Cookies-CookiesDisplay)*0.5;
	l('money').innerHTML=Math.round(CookiesDisplay);

	var str='';
	if (Cookies<5) str='You feel like making cookies.<br>But nobody wants to eat your cookies.';
	else if (Cookies<25) str='Your cookies are popular<br>with your dog.';
	else if (Cookies<50) str='Your cookies are popular<br>with your family.';
	else if (Cookies<100) str='Your cookies are popular<br>in the neighborhood.';
	else if (Cookies<500) str='Your cookies are renowned<br>in the whole town!';
	else if (Cookies<2000) str='Your cookies are worth<br>a lot of money.';
	else if (Cookies<5000) str='Your cookies bring<br>all the boys to the yard.';
	else if (Cookies<10000) str='People come from very far away<br>to get a taste of your cookies.';
	else if (Cookies<17000) str='Kings and queens from all over the world<br>are enjoying your cookies.';
	else if (Cookies<30000) str='Your cookies have been named<br>a part of the world wonders.';
	else if (Cookies<60000) str='Your cookies have been placed<br>under government surveillance.';
	else if (Cookies<100000) str='The whole planet is<br>enjoying your cookies!';
	else if (Cookies<150000) str='Creatures from neighboring planets<br>wish to try your cookies.';
	else if (Cookies<250000) str='Elder gods from the whole cosmos<br>have awoken to taste your cookies.';
	else if (Cookies<400000) str='Your cookies have achieved sentience.';
	else if (Cookies<1000000) str='The universe has now turned into<br>cookie dough, to the molecular level.';
	else if (Cookies<1000000000) str='A local news station runs<br>a 10-minute segment about your cookies. Success!<br><span style="font-size:50%;">(you win a cookie)</span>';
	else str='it\'s time to stop playing<br><span style="font-size:50%;">(more fun milestones in the next update I promise)</span>';
	l('comment').innerHTML=str;



	if (Cookies>=1000000)
	{
		var icon='';
		if (Cookies>2000000)
		{
			if (Math.random()<0.02) icon='invert';
			else if (Math.random()<0.02) icon='lustful';
		}
		if (Math.random()<(Cookies-1000000)/2000000) l('whole').style.background='url(grandmaicon'+icon+') '+Math.floor(Math.random()*4)+'px '+Math.floor(Math.random()*4)+'px';
	}//sorry

	Clicking=0;
	Hovering=0;

	if ((T)%(30*60)==0 && T>30*5 && Loaded) Save();

	T++;
	setTimeout(Main,1000/30);
}


Load();
