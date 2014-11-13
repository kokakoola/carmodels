be.marlon.Configuration = function()
{	
	// Reference the function of the utility class
	var _getIndex = be.marlon.Utility.getIndex;
	
	// The id's required for webservice communication
	this.Country = "";
	this.Brand = "";
	this.Language = "";
	this.ModelID = "";
	this.CarName = "";
	this.SubModelID = "00000000-0000-0000-0000-000000000000";
	this.CarID = "00000000-0000-0000-0000-000000000000";
	this.BodyTypeID = "00000000-0000-0000-0000-000000000000";
	this.EngineID =	  "00000000-0000-0000-0000-000000000000";
	this.FuelTypeID = "00000000-0000-0000-0000-000000000000";
	this.TransmissionID = "00000000-0000-0000-0000-000000000000";
	this.WheelDriveID = "00000000-0000-0000-0000-000000000000";
	this.GradeID = "00000000-0000-0000-0000-000000000000";
	this.ExteriorColourID = "00000000-0000-0000-0000-000000000000";
	this.UpholsteryID = "00000000-0000-0000-0000-000000000000";
	this.Options = [];
	this.WheelID = "00000000-0000-0000-0000-000000000000";
	this.Packs = [];
	this.Accessories = [];
	this.InlayID = "00000000-0000-0000-0000-000000000000";
	
	// The labels related to the selected id's
	this.ModelLabel = "";
	this.BodyTypeLabel = "";
	this.EngineLabel = "";
	this.EngineTypeLabel = "";
	this.TransmissionLabel = "";
	this.WheelDriveLabel = "";
	this.GradeLabel = "";
	this.ExteriorColourLabel = "";
	this.ExteriorColourDisclaimer = "";
	this.UpholstryLabel = "";
	this.InlayLabel = "";
	this.OptionsLabels = [];
	this.WheelLabel = "";
	this.PackLabels = [];
	this.AccessoriesLabels = [];

	
	// The price variables, exist out of PriceInfo Objects
	this.BasePrice = null; // Contains out of BodyType, Engine, EngineType, Transmission, WheelDrive, Grade, Model and SubModel
	this.ExteriorColourPrice = null;
	this.OptionsPrices = [];
	this.AccessoriesPrices = [];
	this.UpholstryPrice = null;
	this.InlayPrice = null;
	this.WheelPrice = null;
	this.PackPrices = [];
	
	// Calculated values
	this.TotalPrice = 0;
	this.TotalPriceDiscount = 0;
	
	// Extra variable
	this.OptionsTypes = [];
	
	/**
	* Method which sets a specific Options item to the Options array
	* @param id:String the id of the item to be added
	*/
	this.addOptions = function(id, label, price, type)
	{
		var index = _getIndex(this.Options,id);
		if(index == -1)
		{
			this.Options.push(id);
			this.OptionsLabels.push(label);
			this.OptionsPrices.push(price);
			this.OptionsTypes.push(type);
		}
	};
	
	/**
	* Method which removes a specific Options item of the Options array
	* @param id:String the id of the item to be removed
	*/
	this.removeOptions = function(id)
	{
		var index = _getIndex(this.Options, id);
		if(index != -1)
		{
			this.Options.splice(index,1);
			this.OptionsLabels.splice(index, 1);
			this.OptionsPrices.splice(index, 1);
			this.OptionsTypes.splice(index, 1);
		}
	};
	
	/**
	* Method which checks if the configuration has a specific accessory selected
	*/
	this.hasOption = function(id)
	{
		return _getIndex(this.Options, id) == -1?false:true;
	};
	
	/**
	* Method which sets a specific pack to the pack array
	* @param id:String the id of the item to be added
	*/
	this.addPack = function(id, label, price)
	{
		var index = _getIndex(this.Packs, id);
		if(index == -1)
		{
			this.Packs.push(id);
			this.PackLabels.push(label);
			this.PackPrices.push(price);
		}
	};
	
	/**
	* Method which removes a specific pack from the packs array
	* @param id:String the id of the item to be removed
	*/
	this.removePack = function(id)
	{
		var index = _getIndex(this.Packs, id);
		if(index != -1)
		{
			this.Packs.splice(index,1);
			this.PackLabels.splice(index, 1);
			this.PackPrices.splice(index, 1);
		}
	};
	
	/**
	* Method which adds an accessorie
	* @param id:String the id of the item to be added
	* @param label:String the label text to be added
	* @param price:Number the price related to the item
	*/
	this.addAccessory = function(id, label, price)
	{
		var index = _getIndex(this.Accessories, id);
		if(index == -1)
		{
			this.Accessories.push(id);
			this.AccessoriesLabels.push(label);
			this.AccessoriesPrices.push(price);
		}
	};
	
	/**
	* Method which removes an accessorie
	* @param id:String the id of the item to be removed
	*/
	this.removeAccessory = function(id)
	{
		var index = _getIndex(this.Accessories, id);
		if(index != -1)
		{
			this.Accessories.splice(index,1);
			this.AccessoriesLabels.splice(index, 1);
			this.AccessoriesPrices.splice(index, 1);
		}
	};
	
	/**
	* Method which checks if the configuration has a specific accessory selected
	*/
	this.hasAccessory = function(id)
	{
		return _getIndex(this.Accessories, id) == -1?false:true;
	};
	
	/**
	* Method which resets the configuration object back to the blank content
	*/
	this.reset = function()
	{
		this.CarID = "00000000-0000-0000-0000-000000000000";
		this.BodyTypeID = "00000000-0000-0000-0000-000000000000";
		this.EngineID =	  "00000000-0000-0000-0000-000000000000";
		this.FuelTypeID = "00000000-0000-0000-0000-000000000000";
		this.TransmissionID = "00000000-0000-0000-0000-000000000000";
		this.WheelDriveID = "00000000-0000-0000-0000-000000000000";
		this.GradeID = "00000000-0000-0000-0000-000000000000";
		this.ExteriorColourID = "00000000-0000-0000-0000-000000000000";
		this.UpholsteryID = "00000000-0000-0000-0000-000000000000";
		this.InlayID = "00000000-0000-0000-0000-000000000000";
		this.Options = [];
		this.Packs = [];
		this.Accessories = [];
		this.WheelID = "00000000-0000-0000-0000-000000000000";
	};
	
	/**
	 * Method which compares itselve against another configuration object
	 * @param c1:Config 
	 */
	this.equals = function(c1)
	{
		var sProp,
			i,
			iL;
		for(sProp in this)
		{
			// Only check the primitive variables
			if(typeof this[sProp] == "string")
			{
				if(this[sProp] != c1[sProp])return false;
			}
			// Check the options/accessories/packs
			if(sProp === "Options" || sProp === "Accessories" || sProp === "Packs")
			{
				i = 0;
				tL = c1[sProp].length;
				iL = this[sProp].length;
				if(tL != iL) return false;
				for(; i < tL; i++)
				{
					if(this[sProp][i] != c1[sProp][i]) return false;
				}
			}
		}
		return true;
	};
	
	/**
	* Method which returns if a property is empty or not, since they require a default guid filling, we need this method
	* @param prop:String
	* @return bEmpty:Boolean
	*/
	this.isEmpty = function(prop)
	{
		return (prop == "00000000-0000-0000-0000-000000000000");
	};
	
	this.isValid = function(prop)
	{
		var regex = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/;
		regex = regex.exec(prop);
		return regex && regex.index === 0?true:false;
	};
	
	///////////////////////
	// Getters and setters
	///////////////////////
	
};
