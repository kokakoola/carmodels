be.marlon.DataEvent = function(type, data)
{
	this.type = type;
	this.data = data;
	
	// Gets filled in automatically on dispatching of the event
	this.target = null;
};