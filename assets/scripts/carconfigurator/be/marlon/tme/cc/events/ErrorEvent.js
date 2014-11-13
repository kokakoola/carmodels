be.marlon.ErrorEvent = function(type, text, critical, method)
{
	var d = new Date();
	this.type = type;
	this.text = "(" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ":" + d.getMilliseconds() + ") " + text;
	this.method = method;
	d = null;
	this.critical = critical;
	
	// Gets filled in automatically on dispatching of the event
	this.target = null;
};