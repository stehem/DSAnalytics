var dsanalytics = {
	setCookie:function(c_name,value,exdays){
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
		document.cookie=c_name + "=" + c_value;
	},
	getCookie:function(c_name){
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++){
  		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
  		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
  		x=x.replace(/^\s+|\s+$/g,"");
  		if (x==c_name){
    		return unescape(y);
    	}
  	}
	},
	checkCookie:function(){
		var dsanalytics_id=this.getCookie("dsanalytics_id");
  	if (dsanalytics_id!=null && dsanalytics_id!=""){
  	}
		else{
			this.setCookie('dsanalytics_id',Math.floor(Math.random()*10000),30);
  	}
	}
}

	dsanalytics.checkCookie();

	var pixel = new Image();
	pixel.src = 'http://localhost:3000/tracker?dsanalytics_sid=1234&dsanalytics_vid=' + dsanalytics.getCookie('dsanalytics_id');


