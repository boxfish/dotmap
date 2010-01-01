/**
 * @requires OpenLayers/Format/WMC/v1.js
 */

/**
 * Class: OpenLayers.Format.WMC.v1_1_0_ex
 * Read and write WMC version 1.1.0.ex.
 *
 *     - extend the WMC format to support non-WMS layers
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMC.v1.1.0>
 */
OpenLayers.Format.WMC.v1_1_0_ex = OpenLayers.Class(
    OpenLayers.Format.WMC.v1_1_0, {
    
    /**
     * Constant: VERSION
     * {String} 1.1.0.ex
     */
    VERSION: "1.1.0.ex",

	/**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
		ol: "http://openlayers.org/context",
        wmc: "http://www.opengis.net/context",
        sld: "http://www.opengis.net/sld",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/context
     *     http://www.opengis.net/context/1.1.0/context.xsd
     */
    schemaLocation: "http://www.opengis.net/context http://www.opengis.net/context/1.1.0/context.xsd",

    /**
     * Constructor: OpenLayers.Format.WMC.v1_1_0_ex
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.WMC> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.WMC.v1_1_0.prototype.initialize.apply(
            this, [options]
        );
    },

	
    
    /**
     * Method: getLayerFromInfo
     * Create a WMS layer from a layerInfo object.
     *
     * Parameters:
     * layerInfo - {Object} An object representing a WMS layer.
     *
     * Returns:
     * {<OpenLayers.Layer.WMS>} A WMS layer.
     */
    getLayerFromInfo: function(layerInfo) {
        var options = layerInfo.options;
        if (this.layerOptions) {
            OpenLayers.Util.applyDefaults(options, this.layerOptions);
        }
		var layer = null;
		if (layerInfo.service === 'OGC:WMS') {
			layer = new OpenLayers.Layer.WMS(
	            layerInfo.title,
	            layerInfo.href,
	            layerInfo.params,
	            options
	        );
		}
		else if (layerInfo.service.indexOf('OSM:') === 0) {
			var type = layerInfo.service.split(':')[1];
			layer = new OpenLayers.Layer.OSM[type](
				layerInfo.title,
				layerInfo.href,
            	options
           );
		}
		else if (layerInfo.service === 'CloudMade') {
			options.key = 'f38c5234c1535d43861214e3db5221c0';
			options.styleId = layerInfo.params.styles;
			layer = new OpenLayers.Layer.CloudMade(
	            layerInfo.title,
	            options
	        );
		}
		else if (layerInfo.service === 'Image') {
			layer = new OpenLayers.Layer.Image(
			                layerInfo.title,
			                layerInfo.href,
							new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
			                new OpenLayers.Size(464, 487),
			                {numZoomLevels: 4}
			);
		}
		else if (layerInfo.service === 'KML') {
			layer = new OpenLayers.Layer.Vector(layerInfo.title, {
    			projection: new OpenLayers.Projection('EPSG:4326'),
				styleMap: new OpenLayers.StyleMap({'default':{
				                    strokeColor: "#00FF00",
				                    strokeOpacity: 1,
				                    strokeWidth: 3,
				                    fillColor: "#FF5500",
				                    fillOpacity: 0.5,
				                    pointRadius: 6,
				                    pointerEvents: "visiblePainted",
				                    label : "name",

				                    fontColor: "red",
				                    fontSize: "12px",
				                    fontFamily: "Courier New, monospace",
				                    fontWeight: "bold",
				                    labelAlign: "cm"
				                }}),
    			strategies: [new OpenLayers.Strategy.Fixed()],
				protocol: new OpenLayers.Protocol.HTTP({
        			url: layerInfo.href,
        			format: new OpenLayers.Format.KML({
            			extractStyles: true,
            			extractAttributes: true
        			})
    			})
			});
		}
		else if (layerInfo.service.indexOf('Google:') === 0) {
			options.sphericalMercator = true;
			switch (layerInfo.service.split(':')[1]) {
			case 'Normal':
				options.type = G_NORMAL_MAP;
				break;
			case 'Satellite':
				options.type = G_SATELLITE_MAP;
				break;
			case 'Hybrid':
				options.type = G_HYBRID_MAP;
				break;
			case 'Physical':
				options.type = G_PHYSICAL_MAP;
				break;
			default:
				return;
			}
			layer = new OpenLayers.Layer.Google(
	            layerInfo.title,
	            options
	        );
			layer.params = {};
		}
		else if (layerInfo.service.indexOf('VE:') === 0) {
			options.sphericalMercator = true;
			switch (layerInfo.service.split(':')[1]) {
			case 'Road':
				options.type = VEMapStyle.Road;
				break;
			case 'Aerial':
				options.type = VEMapStyle.Aerial;
				break;
			case 'Hybrid':
				options.type = VEMapStyle.Hybrid;
				break;
			default:
				return;
			}
			layer = new OpenLayers.Layer.VirtualEarth(
	            layerInfo.title,
	            options
	        );
			layer.params = {};
		}
        return layer;
    },

	/**
     * Method: read_wmc_Server
     */
    read_wmc_Server: function(layerInfo, node) {
        layerInfo.params.version = node.getAttribute("version");
		layerInfo.service = node.getAttribute("service");
        this.runChildNodes(layerInfo, node);
    },
	
	/**
     * Method: write_wmc_LayerList
     * Create a LayerList node given an context object.
     *
     * Parameters:
     * context - {Object} Context object.
     *
     * Returns:
     * {Element} A WMC LayerList element node.
     */
    write_wmc_LayerList: function(context) {
        var list = this.createElementDefaultNS("LayerList");
        var layer;
        // make sure the current base layer goes first
		for(var i=0, len=context.layers.length; i<len; ++i) {
            layer = context.layers[i];
			if (layer.isBaseLayer && layer.visibility) {
				list.appendChild(this.write_wmc_Layer(layer));
			}
        }
        for(var i=0, len=context.layers.length; i<len; ++i) {
            layer = context.layers[i];
			if (!layer.isBaseLayer || !layer.visibility) {
				list.appendChild(this.write_wmc_Layer(layer));
			}
        }
        return list;
    },

	/**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer object.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC Layer element node.
     */
    write_wmc_Layer: function(layer) {
        var node = this.createElementDefaultNS(
            "Layer", null, {
                queryable: layer.queryable ? "1" : "0",
                hidden: layer.visibility ? "0" : "1"
            }
        );
        
        // required Server element
        node.appendChild(this.write_wmc_Server(layer));

        // required Name element
		var name;
		if (layer.params && layer.params["LAYERS"]) {
			name = layer.params["LAYERS"];
		}
		else {
			name = layer.name;
		}
        node.appendChild(this.createElementDefaultNS(
            "Name", name
        ));

        // required Title element
        node.appendChild(this.createElementDefaultNS(
            "Title", layer.name
        ));

        // optional MetadataURL element
        if (layer.metadataURL) {
            node.appendChild(this.write_wmc_MetadataURL(layer));
        }
        
        // optional FormatList element
        node.appendChild(this.write_wmc_FormatList(layer));

        // optional StyleList element
        node.appendChild(this.write_wmc_StyleList(layer));
        
        // OpenLayers specific properties go in an Extension element
        node.appendChild(this.write_wmc_LayerExtension(layer));

		// min/max scale denominator elements go before the 4th element in v1
        if(layer.options.resolutions || layer.options.scales ||
           layer.options.minResolution || layer.options.maxScale) {
            var minSD = this.createElementNS(
                this.namespaces.sld, "sld:MinScaleDenominator"
            );
            minSD.appendChild(this.createTextNode(layer.maxScale.toPrecision(10)));
            node.insertBefore(minSD, node.childNodes[3]);
        }
        
        if(layer.options.resolutions || layer.options.scales ||
           layer.options.maxResolution || layer.options.minScale) {
            var maxSD = this.createElementNS(
                this.namespaces.sld, "sld:MaxScaleDenominator"
            );
            maxSD.appendChild(this.createTextNode(layer.minScale.toPrecision(10)));
            node.insertBefore(maxSD, node.childNodes[4]);
        }

        return node;
    },

	/**
     * Method: write_wmc_Server
     * Create a Server node given a layer object.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC Server element node.
     */
    write_wmc_Server: function(layer) {
        var node = this.createElementDefaultNS("Server");
		var service = '';
		var version = '1.0.0';
        if(layer instanceof OpenLayers.Layer.WMS) {
        	service = 'OGC:WMS';
			version = layer.params['VERSION'];
		}
		else if (layer.CLASS_NAME.indexOf('OpenLayers.Layer.OSM') === 0) {
			var service = 'OSM:' + (layer.CLASS_NAME.split('.'))[3];
			
		}
		else if(layer.CLASS_NAME === 'OpenLayers.Layer.CloudMade') {
        	service = 'CloudMade';
		}
		else if(layer.CLASS_NAME === 'OpenLayers.Layer.Google') {
        	service = 'Google:';
			var name = layer.options.type.getName();
			if (name === 'Map') {
				service += 'Normal';
			}
			else if (name === 'Satellite') {
				service += 'Satellite';
			}
			else if (name === 'Hybrid') {
				service += 'Hybrid';
			}
			else if (name === 'Physical') {
				service += 'Physical';
			}
		}
		else if(layer.CLASS_NAME === 'OpenLayers.Layer.VirtualEarth') {
        	service = 'VE:';
			if (layer.options.type === VEMapStyle.Road) {
				service += 'Road';
			}
			else if (layer.options.type === VEMapStyle.Aerial) {
				service += 'Aerial';
			}
			else if (layer.options.type === VEMapStyle.Hybrid) {
				service += 'Hybrid';
			}
		}
		this.setAttributes(node, {
            service: service,
            version: version
        });
		// required OnlineResource element
        node.appendChild(this.write_wmc_OnlineResource(layer.url));
        
		        
        return node;
    },

	/**
     * Method: write_wmc_StyleList
     * Create a StyleList node given a layer.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC StyleList element node.
     */
    write_wmc_StyleList: function(layer) {
        var node = this.createElementDefaultNS("StyleList");
        var style = this.createElementDefaultNS(
            "Style", null, {current: "1"}
        );

        // Style can come from one of three places (prioritized as below):
        // 1) an SLD parameter
        // 2) and SLD_BODY parameter
        // 3) the STYLES parameter
		if (!layer.params) {
			return;
		}
        if(layer.params["SLD"]) {
            // create link from SLD parameter
            var sld = this.createElementDefaultNS("SLD");
            var link = this.write_wmc_OnlineResource(layer.params["SLD"]);
            sld.appendChild(link);
            style.appendChild(sld);
        } else if(layer.params["SLD_BODY"]) {
            // include sld fragment from SLD_BODY parameter
            var sld = this.createElementDefaultNS("SLD");
            var body = layer.params["SLD_BODY"];
            // read in body as xml doc - assume proper namespace declarations
            var doc = OpenLayers.Format.XML.prototype.read.apply(this, [body]);
            // append to StyledLayerDescriptor node
            var imported = doc.documentElement;
            if(sld.ownerDocument && sld.ownerDocument.importNode) {
                imported = sld.ownerDocument.importNode(imported, true);
            }
            sld.appendChild(imported);
            style.appendChild(sld);            
        } else {
            // use name(s) from STYLES parameter
			var name = this.defaultStyleName
			if (layer.params["STYLES"]) {
				name = layer.params["STYLES"];
			}
			else if (layer.options.styleId) {
				name = layer.options.styleId;
			}

            style.appendChild(this.createElementDefaultNS("Name", name));
            style.appendChild(this.createElementDefaultNS(
                "Title", this.defaultStyleTitle
            ));
        }
        node.appendChild(style);
        return node;
    },

    CLASS_NAME: "OpenLayers.Format.WMC.v1_1_0_ex" 

});