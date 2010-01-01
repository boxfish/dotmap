window.PGTree = (function() {
	var T = function() {
		return create.apply(T, arguments);
	};
	T.version = "1.0";
	// default values
	T.defaults = {
		iMaxDepth : 100,
		iLevelSeparation : 40,
		iSiblingSeparation : 40,
		iSubtreeSeparation : 80,
		iRootOrientation : "top",	// possible values "top, bottom, left, right"
		iNodeJustification : "top",	// possible values "top, bottom, center"
		topXAdjustment : 0,
		topYAdjustment : 0,		
		linkType : "M",	// possible values "M, B" M - Manhattan (straight lines) B - Bazier (curves)
		nodeWidth : 80,
		nodeHeight : 40,
		treeWidth : 640,
		treeHeight : 480,
		selectMode : "multiple"	// possible values "single, multiple"
	};
	T.styles = {
		node : {
			fill: "blue", 
			stroke: "blue", 
			"fill-opacity": 0.5, 
			"stroke-width": 2
		},
		label : {
			stroke:"#fff"
		},
		link : {
			stroke:"#fff"
		}	
	};
	
	//Layout algorithm
	T._firstWalk = function (tree, node, level) {
		var leftSibling = null;

        node.XPosition = 0;
        node.YPosition = 0;
        node.prelim = 0;
        node.modifier = 0;
        node.leftNeighbor = null;
        node.rightNeighbor = null;
        tree._setLevelHeight(node, level);
        tree._setLevelWidth(node, level);
        tree._setNeighbors(node, level);
        if(node._getChildrenCount() == 0 || level == tree.settings.iMaxDepth)
        {
            leftSibling = node._getLeftSibling();
            if(leftSibling != null)
                node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.settings.iSiblingSeparation;
            else
                node.prelim = 0;
        } 
        else
        {
            var n = node._getChildrenCount();
            for(var i = 0; i < n; i++)
            {
                var iChild = node._getChildAt(i);
                T._firstWalk(tree, iChild, level + 1);
            }

            var midPoint = node._getChildrenCenter(tree);
            midPoint -= tree._getNodeSize(node) / 2;
            leftSibling = node._getLeftSibling();
            if(leftSibling != null)
            {
                node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.settings.iSiblingSeparation;
                node.modifier = node.prelim - midPoint;
                T._apportion(tree, node, level);
            } 
            else
            {            	
                node.prelim = midPoint;
            }
        }	
	}

	T._apportion = function (tree, node, level) {
        var firstChild = node._getFirstChild();
        var firstChildLeftNeighbor = firstChild.leftNeighbor;
        var j = 1;
        for(var k = tree.settings.iMaxDepth - level; firstChild != null && firstChildLeftNeighbor != null && j <= k;)
        {
            var modifierSumRight = 0;
            var modifierSumLeft = 0;
            var rightAncestor = firstChild;
            var leftAncestor = firstChildLeftNeighbor;
            for(var l = 0; l < j; l++)
            {
                rightAncestor = rightAncestor.nodeParent;
                leftAncestor = leftAncestor.nodeParent;
                modifierSumRight += rightAncestor.modifier;
                modifierSumLeft += leftAncestor.modifier;
            }

            var totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft + tree._getNodeSize(firstChildLeftNeighbor) + tree.settings.iSubtreeSeparation) - (firstChild.prelim + modifierSumRight);
            if(totalGap > 0)
            {
                var subtreeAux = node;
                var numSubtrees = 0;
                for(; subtreeAux != null && subtreeAux != leftAncestor; subtreeAux = subtreeAux._getLeftSibling())
                    numSubtrees++;

                if(subtreeAux != null)
                {
                    var subtreeMoveAux = node;
                    var singleGap = totalGap / numSubtrees;
                    for(; subtreeMoveAux != leftAncestor; subtreeMoveAux = subtreeMoveAux._getLeftSibling())
                    {
                        subtreeMoveAux.prelim += totalGap;
                        subtreeMoveAux.modifier += totalGap;
                        totalGap -= singleGap;
                    }

                }
            }
            j++;
            if(firstChild._getChildrenCount() == 0)
                firstChild = tree._getLeftmost(node, 0, j);
            else
                firstChild = firstChild._getFirstChild();
            if(firstChild != null)
                firstChildLeftNeighbor = firstChild.leftNeighbor;
        }
	};

	T._secondWalk = function (tree, node, level, X, Y) {
	        if(level <= tree.settings.iMaxDepth)
	        {
	            var xTmp = tree.rootXOffset + node.prelim + X;
	            var yTmp = tree.rootYOffset + Y;
	            var maxsizeTmp = 0;
	            var nodesizeTmp = 0;
	            var flag = false;

	            switch(tree.settings.iRootOrientation)
	            {            
		            case "top":
		            case "bottom":	        	            	    	
		                maxsizeTmp = tree.maxLevelHeight[level];
		                nodesizeTmp = node.height;	                
		                break;

		            case "right":
		            case "left":            
		                maxsizeTmp = tree.maxLevelWidth[level];
		                flag = true;
		                nodesizeTmp = node.width;
		                break;
	            }
	            switch(tree.settings.iNodeJustification)
	            {
		            case "top":
		                node.XPosition = xTmp;
		                node.YPosition = yTmp;
		                break;

		            case "center":
		                node.XPosition = xTmp;
		                node.YPosition = yTmp + (maxsizeTmp - nodesizeTmp) / 2;
		                break;

		            case "bottom":
		                node.XPosition = xTmp;
		                node.YPosition = (yTmp + maxsizeTmp) - nodesizeTmp;
		                break;
	            }
	            if(flag)
	            {
	                var swapTmp = node.XPosition;
	                node.XPosition = node.YPosition;
	                node.YPosition = swapTmp;
	            }
	            switch(tree.settings.iRootOrientation)
	            {
		            case "bottom":
		                node.YPosition = -node.YPosition - nodesizeTmp;
		                break;

		            case "right":
		                node.XPosition = -node.XPosition - nodesizeTmp;
		                break;
	            }
	            if(node._getChildrenCount() != 0)
	                T._secondWalk(tree, node._getFirstChild(), level + 1, X + node.modifier, Y + maxsizeTmp + tree.settings.iLevelSeparation);
	            var rightSibling = node._getRightSibling();
	            if(rightSibling != null)
	                T._secondWalk(tree, rightSibling, level, X, Y);
	        }	
	};
	
	var template = {};
	
	var create = function() {
		var tree = {
			render : null,
			settings : {},
			styles : {},
			
			maxLevelHeight : [],
			maxLevelWidth : [],
			previousLevelNode : [],
			rootYOffset : 0,
			rootXOffset : 0,
			
			nDatabaseNodes : [],
			mapIDs : {},
			
			root : null,
			data: null,
			
			iSelectedNode : -1,
			iLastSearch : 0,
			
			panStartX : -1,
			panStartY : -1,
			panOffsetX : 0,
			panOffsetY : 0,
			scaleLevel : 1,
			
			visualElms : null,
			elmIDs : {},
			
			blankets : null,
			blkIDs : {},
			
			tooltips : null,			
			events : ["click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup"] 
		};
		
		var container = arguments[0];
		if (!container) {
            throw new Error("container not found.");
        }
		
		// copy default setting values
		for (var idx in T.defaults) {
			tree.settings[idx] = T.defaults[idx];
		}
		// tree settings
		var settings = arguments[1];
		if (settings) {
			for (var idx in settings) {
				tree.settings[idx] = settings[idx];
			}
		}
		
		// copy default styles
		for (var idx in T.styles) {
			var style = T.styles[idx];
			tree.styles[idx] = tree.styles[idx] || {};
			for (var idx1 in style) {
				tree.styles[idx][idx1] = T.styles[idx][idx1];
			}
		}
		// tree styles
		var styles = arguments[2];
		if (styles) {
			for (var idx in styles) {
				tree.styles[idx] = tree.styles[idx] || {};
				for (var idx1 in styles[idx]) {
					tree.styles[idx][idx1] = styles[idx][idx1];
				}
			}
		}
		
		var render = Raphael(container, tree.settings.treeWidth, tree.settings.treeHeight);
		if (!render) {
			throw new Error("cannot create the render object.");
		}
		tree.render = render;
		tree.visualElms = tree.render.set();
		tree.blankets = tree.render.set();
		tree.tooltips = tree.render.set();
		
		// draw the blanket for mouse move events
		var blanket = render.rect(0, 0, tree.settings.treeWidth, tree.settings.treeHeight).attr({stroke: "none", fill: "#fff", opacity: 0});
		(function (tree) {
			blanket.mousedown(function (e) {
				tree.panStartX = e.pageX;
				tree.panStartY = e.pageY;
				if (e.preventDefault)
					e.preventDefault();
				else
					e.returnValue= false;
				return false;
			});
			blanket.mousemove(function (e) {
				var newX = e.pageX;
				var newY = e.pageY;
				if (tree.panStartX !== -1 && tree.panStartY !== -1) {
					if (newX !== tree.panStartX || newY !== tree.panStartY) {
						//alert(newX + "," + newY);
						offsetX = newX - tree.panStartX;
						offsetY = newY - tree.panStartY;
						tree.translate(offsetX, offsetY);
						tree.panStartX = newX;
						tree.panStartY = newY;
					}
				}
				
			});
			blanket.mouseup(function (e) {
				tree.panStartX = -1;
				tree.panStartY = -1;
			});
			blanket.mouseout(function (e) {
				tree.panStartX = -1;
				tree.panStartY = -1;
			});
			blanket.mouseover(function() {
				blanket.node.style.cursor = 'move';
			});
		})(tree);
		
		for (var prop in template) {
            tree[prop] = template[prop];
        }
		
		//tree.root = new PGNode(-1, null, "null");
		return tree;
	};
	
	template._positionTree = function () {	
		this.maxLevelHeight = [];
		this.maxLevelWidth = [];			
		this.previousLevelNode = [];		
		T._firstWalk(this, this.root, 0);
		
		switch(this.settings.iRootOrientation)
		{            
		    case "top":
		    case "left": 
		    		this.rootXOffset = this.settings.topXAdjustment + this.root.XPosition;
		    		this.rootYOffset = this.settings.topYAdjustment + this.root.YPosition;
		        break;    

		    case "bottom":	
		    case "right":             
		    		this.rootXOffset = this.settings.topXAdjustment + this.root.XPosition;
		    		this.rootYOffset = this.settings.topYAdjustment + this.root.YPosition;
		}	

		T._secondWalk(this, this.root, 0, 0, 0);	
	};
	
	template._setLevelHeight = function (node, level) {	
		if (this.maxLevelHeight[level] == null) 
			this.maxLevelHeight[level] = 0;
	    if(this.maxLevelHeight[level] < node.height)
	        this.maxLevelHeight[level] = node.height;	
	};

	template._setLevelWidth = function (node, level) {
		if (this.maxLevelWidth[level] == null) 
			this.maxLevelWidth[level] = 0;
	    if(this.maxLevelWidth[level] < node.width)
	        this.maxLevelWidth[level] = node.width;		
	};

	template._setNeighbors = function(node, level) {
	    node.leftNeighbor = this.previousLevelNode[level];
	    if(node.leftNeighbor != null)
	        node.leftNeighbor.rightNeighbor = node;
	    this.previousLevelNode[level] = node;	
	};

	template._getNodeSize = function (node) {
	    switch(this.settings.iRootOrientation)
	    {
	    case "top": 
	    case "bottom": 
	        return node.width;

	    case "right": 
	    case "left": 
	        return node.height;
	    }
	    return 0;
	};

	template._getLeftmost = function (node, level, maxlevel) {
	    if(level >= maxlevel) return node;
	    if(node._getChildrenCount() == 0) return null;

	    var n = node._getChildrenCount();
	    for(var i = 0; i < n; i++)
	    {
	        var iChild = node._getChildAt(i);
	        var leftmostDescendant = this._getLeftmost(iChild, level + 1, maxlevel);
	        if(leftmostDescendant != null)
	            return leftmostDescendant;
	    }

	    return null;	
	};

	template._selectNodeInt = function (dbindex, flagToggle) {
		if (this.settings.selectMode == "single")
		{
			if ((this.iSelectedNode != dbindex) && (this.iSelectedNode != -1))
			{
				this.nDatabaseNodes[this.iSelectedNode].isSelected = false;
			}		
			this.iSelectedNode = (this.nDatabaseNodes[dbindex].isSelected && flagToggle) ? -1 : dbindex;
		}	
		this.nDatabaseNodes[dbindex].isSelected = (flagToggle) ? !this.nDatabaseNodes[dbindex].isSelected : true;	
	};

	template._collapseAllInt = function (flag) {
		var node = null;
		for (var n = 0; n < this.nDatabaseNodes.length; n++)
		{ 
			node = this.nDatabaseNodes[n];
			if (node.canCollapse) node.isCollapsed = flag;
		}	
	};

	template._selectAllInt = function (flag) {
		var node = null;
		for (var k = 0; k < this.nDatabaseNodes.length; k++)
		{ 
			node = this.nDatabaseNodes[k];
			node.isSelected = flag;
		}	
		this.iSelectedNode = -1;
	};
	
	template._centerRoot = function() {
		switch(this.settings.iRootOrientation)
	    {
	    case "top":
			this.settings.topXAdjustment = (this.settings.treeWidth - this._getNodeSize(this.root)) * 0.5 - this.root.XPosition;
			this.settings.topYAdjustment = this.settings.iLevelSeparation;
			break;
	    case "bottom":
	 		this.settings.topXAdjustment = (this.settings.treeWidth - this._getNodeSize(this.root)) * 0.5 - this.root.XPosition;
			this.settings.topYAdjustment =  this.settings.iLevelSeparation - this.settings.treeHeight;
			break;
	    case "right": 
			//this.settings.topYAdjustment = 
			this.settings.topXAdjustment = (this.settings.treeHeight  - this._getNodeSize(this.root)) * 0.5 - this.root.YPosition;
			this.settings.topYAdjustment = this.settings.iSiblingSeparation - this.settings.treeWidth;
			break;
	    case "left": 
	        this.settings.topXAdjustment = (this.settings.treeHeight  - this._getNodeSize(this.root)) * 0.5 - this.root.YPosition;
			this.settings.topYAdjustment = this.settings.iSiblingSeparation;
			break;
	    }
		this._positionTree();
	};
	
	template._drawTree = function() {
		
		for (var n = 0; n < this.nDatabaseNodes.length; n++) { 
			node = this.nDatabaseNodes[n];
			if (!node._isAncestorCollapsed()) {
				if (node.drawNode) {
					node.drawNode(this);
				}
				else {
					node._drawNode(this);
				}
			}
			if (!node.isCollapsed)	{
				node._drawChildrenLinks(this);
			}
		}
	};
	
	template.draw = function() {
		this._positionTree();
		//this._centerRoot();
		this._drawTree();
	};
	
	template.translate = function(offsetX, offsetY) {
		this.visualElms.translate(offsetX, offsetY);
		this.blankets.translate(offsetX, offsetY);
		this.tooltips.translate(offsetX, offsetY);
		this.panOffsetX += offsetX / this.scaleLevel;
		this.panOffsetY += offsetY / this.scaleLevel;
	};
	
	template.scale = function(multiplier) {
		this.scaleLevel *= multiplier;
		for (var i=0; i < this.visualElms.length; i++) {
			ele = this.visualElms[i];
			ele.scale(this.scaleLevel,this.scaleLevel, 0, 0);
			if (ele.type == "text") {
				ele.attr({ "font-size": parseFloat(ele.attrs["font-size"]) * multiplier });
			    ele.attr("x", parseFloat(ele.attrs["x"]) * multiplier);
			    ele.attr("y", parseFloat(ele.attrs["y"]) * multiplier);
			  }
		}
		this.blankets.scale(this.scaleLevel,this.scaleLevel, 0, 0);
	};
	
	template.centerRoot = function() {
		var offsetX = 0, offsetY = 0;
		switch(this.settings.iRootOrientation)
	    {
	    case "top":
			offsetX = (this.settings.treeWidth - this._getNodeSize(this.root)) * 0.5 - this.root.XPosition;
			offsetY = this.settings.iLevelSeparation;
			break;
	    case "bottom":
	 		offsetX = (this.settings.treeWidth - this._getNodeSize(this.root)) * 0.5 - this.root.XPosition;
			offsetY = this.settings.treeHeight - this.settings.iLevelSeparation;
			break;
	    case "right": 
			offsetX = this.settings.treeWidth - this.settings.iSiblingSeparation;
			offsetY = (this.settings.treeHeight  - this._getNodeSize(this.root)) * 0.5 - this.root.YPosition;
			break;
	    case "left": 
	        offsetX = this.settings.iSiblingSeparation;
			offsetY = (this.settings.treeHeight  - this._getNodeSize(this.root)) * 0.5 - this.root.YPosition;
			break;
	    }
		this.translate(offsetX, offsetY);
	
	};
		
	template.add = function(id, pid, dsc, settings, styles, data, eventsHandler) {
		var node = new PGNode(id, pid, dsc, settings, styles, data, eventsHandler);	//New node creation...
		node.width = node.width || this.settings.nodeWidth;
		node.height = node.height || this.settings.nodeHeight;
		
		var i = this.nDatabaseNodes.length;	//Save it in database
		node.dbIndex = this.mapIDs[id] = i;	 
		this.nDatabaseNodes[i] = node;	
		
		if (node.pid === null) {
			node.nodeParent = null;
			this.root = node;
		}
		else {
			var pnode = null;
			for (var k = 0; k < this.nDatabaseNodes.length; k++){
				if (this.nDatabaseNodes[k].id == pid){
					pnode = this.nDatabaseNodes[k];
					break;
				}
			}
			pnode.canCollapse = true; //It's obvious that now the parent can collapse	
			var h = pnode.nodeChildren.length; //Add it as child of it's parent
			node.siblingIndex = h;
			pnode.nodeChildren[h] = node;	
			node.nodeParent = pnode;
		}		
		return node;
	};
	
	template.clear = function() {
		this.maxLevelHeight = [];
		this.maxLevelWidth = [];
		this.previousLevelNode = [];
		this.rootYOffset = 0;
		this.rootXOffset = 0;

		this.nDatabaseNodes = [];
		this.mapIDs = {};

		this.root = null;
		this.data= null;

		this.iSelectedNode = -1;
		this.iLastSearch = 0;

		this.panStartX = -1;
		this.panStartY = -1;
		this.panOffsetX = 0;
		this.panOffsetY = 0;
		this.scaleLevel = 1;
		
		this.visualElms.remove();
		this.visualElms = this.render.set();
		this.elmIDs = {};

		this.blankets.remove();
		this.blankets = this.render.set();
		this.blkIDs = {};
		
		this.tooltips.remove();
		this.tooltips = this.render.set();
	};
	
	return T;
})();

window.PGNode = (function() {
	var N = function() {
		return create.apply(N, arguments);
	};
	var template = {};
	
	var create = function() {
		var args = arguments;
		if (args.length < 3) {
			throw new Error("arguments error.");
		}
		var node = {
			id : args[0],
			pid : args[1],
			dsc : args[2],
			width : 0,
			height : 0,
			styles : {},
			data : {},
			eventsHandler : {},
			
			siblingIndex : 0,
			dbIndex : 0,
			
			XPosition : 0,
			YPosition : 0,
			prelim : 0,
			modifier : 0,
			leftNeighbor : null,
			rightNeighbor : null,
			nodeParent : null,
			nodeChildren : [],
			
			isCollapsed : false,
			canCollapse : false,
			
			isSelected : false 
		};
		
		// node settings
		var settings = args[3];
		if (settings) {
			for (var idx in settings) {
				node[idx] = settings[idx];
			}
		}
		// styles
		if (args[4]) {
			node.styles = args[4];
		}
				
		// additional data
		if (args[5]) {
			node.data = args[5];
		}
		
		/*
			TODO support for event handlers
		*/
		if (args[6]) {
			node.eventsHandler = args[6];
		}
		
		// copy template methods
		for (var prop in template) {
            node[prop] = template[prop];
        }
		
		return node;
	};
	
	template._getLevel = function() {
	    /*if (this.nodeParent.id == -1) {
	        return 0;
	    }
	    else {
	        return this.nodeParent._getLevel() + 1;
	    }*/
		if (this.nodeParent === null && this.nodeChildren.length > 0) {
			return 0;
		}
		else {
	        return this.nodeParent._getLevel() + 1;
	    }
	};

	template._isAncestorCollapsed = function() {
	    /*if (this.nodeParent.isCollapsed) {
	        return true;
	    }
	    else
	    {
	        if (this.nodeParent.id == -1) {
	            return false;
	        }
	        else {
	            return this.nodeParent._isAncestorCollapsed();
	        }
	    }*/
		
		if (this.nodeParent === null) {
			return false;
		}
		else {
			if (this.nodeParent.isCollapsed) {
		        return true;
		    }
			else {
	            return this.nodeParent._isAncestorCollapsed();
	        }
		}
	};

	template._setAncestorsExpanded = function() {
	    if (this.nodeParent.id == -1) {
	        return;
	    }
	    else
	    {
	        this.nodeParent.isCollapsed = false;
	        return this.nodeParent._setAncestorsExpanded();
	    }
	};

	template._getChildrenCount = function() {
	    if (this.isCollapsed) {
			return 0;
		}
	    if (this.nodeChildren == null){
			return 0;
		}
	    else {
			return this.nodeChildren.length;
		}
	};

	template._getLeftSibling = function() {
	    if (this.leftNeighbor != null && this.leftNeighbor.nodeParent == this.nodeParent){
			return this.leftNeighbor;
		}
	    else {
			return null;
		}
	};

	template._getRightSibling = function() {
	    if (this.rightNeighbor != null && this.rightNeighbor.nodeParent == this.nodeParent) {
			return this.rightNeighbor;
		}
	    else {
		    return null;
		}
	};

	template._getChildAt = function(i) {
	    return this.nodeChildren[i];
	};

	template._getChildrenCenter = function(tree) {
	    node = this._getFirstChild();
	    node1 = this._getLastChild();
	    return node.prelim + ((node1.prelim - node.prelim) + tree._getNodeSize(node1)) / 2;
	};

	template._getFirstChild = function() {
	    return this._getChildAt(0);
	};

	template._getLastChild = function() {
	    return this._getChildAt(this._getChildrenCount() - 1);
	};

	template._drawNode = function(tree) {
		var label = tree.render.text(node.XPosition + 0.5 * node.width, node.YPosition + 0.5 * node.height, node.dsc);
		label.attr(tree.styles.label);
		var box = tree.render.rect(node.XPosition, node.YPosition, node.width, node.height, 5);
		box.attr(tree.styles.node);
		tree.visualElms.push(label);
		tree.elmIDs[tree.visualElms.length-1] = node.id;
		tree.visualElms.push(box);
		tree.elmIDs[tree.visualElms.length-1] = node.id;
		
		var blanket = tree.render.rect(this.XPosition, this.YPosition, this.width, this.height);
		blanket.attr(tree.styles.blanket).toFront();
		tree.blankets.push(blanket);
		tree.blkIDs[tree.blankets.length-1] = this.id;
		
		if (this.eventHandlers) {
			(function (node, tree) {
				for (var idx in node.eventHandlers) {
					for (var idx1 in tree.blkIDs) {
						if (tree.blkIDs[idx1] === node.id) {
							var elm = tree.blankets[idx1];
							elm[idx](function(e) {
									node.eventHandlers[idx](node, tree, e);
							});
						}
					} 
				}
			})(this, tree);
		}
	};
	
	template._drawChildrenLinks = function(tree) {
	    var xa = 0,
	    ya = 0,
	    xb = 0,
	    yb = 0,
	    xc = 0,
	    yc = 0,
	    xd = 0,
	    yd = 0;
	    var node1 = null;

	    switch (tree.settings.iRootOrientation)
	    {
	    case "top":
	        xa = this.XPosition + (this.width / 2);
	        ya = this.YPosition + this.height;
	        break;

	    case "bottom":
	        xa = this.XPosition + (this.width / 2);
	        ya = this.YPosition;
	        break;

	    case "right":
	        xa = this.XPosition;
	        ya = this.YPosition + (this.height / 2);
	        break;

	    case "left":
	        xa = this.XPosition + this.width;
	        ya = this.YPosition + (this.height / 2);
	        break;
	    }

	    for (var k = 0; k < this.nodeChildren.length; k++)
	    {
	        node1 = this.nodeChildren[k];

	        switch (tree.settings.iRootOrientation)
	        {
	        case "top":
	            xd = xc = node1.XPosition + (node1.width / 2);
	            yd = node1.YPosition;
	            xb = xa;
	            switch (tree.settings.iNodeJustification)
	            {
	            case "top":
	                yb = yc = yd - tree.settings.iLevelSeparation / 2;
	                break;
	            case "bottom":
	                yb = yc = ya + tree.settings.iLevelSeparation / 2;
	                break;
	            case "center":
	                yb = yc = ya + (yd - ya) / 2;
	                break;
	            }
	            break;

	        case "bottom":
	            xd = xc = node1.XPosition + (node1.width / 2);
	            yd = node1.YPosition + node1.height;
	            xb = xa;
	            switch (tree.settings.iNodeJustification)
	            {
	            case "top":
	                yb = yc = yd + tree.settings.iLevelSeparation / 2;
	                break;
	            case "bottom":
	                yb = yc = ya - tree.settings.iLevelSeparation / 2;
	                break;
	            case "center":
	                yb = yc = yd + (ya - yd) / 2;
	                break;
	            }
	            break;

	        case "right":
	            xd = node1.XPosition + node1.width;
	            yd = yc = node1.YPosition + (node1.height / 2);
	            yb = ya;
	            switch (tree.settings.iNodeJustification)
	            {
	            case "top":
	                xb = xc = xd + tree.settings.iLevelSeparation / 2;
	                break;
	            case "bottom":
	                xb = xc = xa - tree.settings.iLevelSeparation / 2;
	                break;
	            case "center":
	                xb = xc = xd + (xa - xd) / 2;
	                break;
	            }
	            break;

	        case "left":
	            xd = node1.XPosition;
	            yd = yc = node1.YPosition + (node1.height / 2);
	            yb = ya;
	            switch (tree.settings.iNodeJustification)
	            {
	            case "top":
	                xb = xc = xd - tree.settings.iLevelSeparation / 2;
	                break;
	            case "bottom":
	                xb = xc = xa + tree.settings.iLevelSeparation / 2;
	                break;
	            case "center":
	                xb = xc = xa + (xd - xa) / 2;
	                break;
	            }
	            break;
	        }
			var link;
			switch (tree.settings.linkType)
            {
            case "M":
				var pathString = "M" + xa + " " + ya + "L" + xb + " " + yb + "L" + xc + " " + yc + "L" + xd + " " + yd;
				link = tree.render.path(pathString).attr(tree.styles.link);
				break;
            case "B":
                var pathString = "M" + xa + " " + ya + "C" + xb + " " + yb + " " + xc + " " + yc + " " + xd + " " + yd;
				link = tree.render.path(pathString).attr(tree.styles.link);
				break;
            }
			tree.visualElms.push(link);
			tree.elmIDs[tree.visualElms.length-1] = this.id;
	    }
	};
	
	return N;
})();