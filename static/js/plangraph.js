window.PlanGraph = (function() {
	var PG = function() {
		return create.apply(PG, arguments);
	};
	var template = {};
	
	var create = function() {
		var pg = {
			agents : [],
			plan : null,
			tree : null
		};
		var container = arguments[0];
		if (!container) {
            throw new Error("container not found.");
        }
		
		var pgTree = new PGTree(container, arguments[1], arguments[2]);
		
		for (var prop in template) {
            pg[prop] = template[prop];
        }
		
		pg.tree = pgTree;
		
		return pg;
	};
		
	template.clear = function() {
		this.agents = [];
		this.plan = null;
		this.nextId = 0;
		this.tree.clear();
	};
	
	template.draw = function() {
		this.tree.draw();
		this.tree.centerRoot();
		this.drawZoomButtons();
	};
	
	template.loadData = function(data) {
		if (data && data.agents && data.root) {
			this.agents = data.agents;
			this.plan = data.root;
			if (this.tree) {
				this.tree.data = data;
				this.addNodetoTree(this.plan, 'action', null);
			}
		}
	};
	
	template.addNodetoTree = function(node, type, pid) {
		var id = node.id;
		var dsc = node.name;
		var settings = null;
		var styles = null;
		var data = node;
		var eventsHandler = null;
		
		var drawNode = null;
		switch (type) {
		case 'action' : 
			drawNode = this.drawActionNode;
			break;
		case 'parameter' : 
			drawNode = this.drawParamNode;
			break;
		case 'optAction' : 
			drawNode = this.drawOptActionNode;
			break;
		}
		eventsHandler = this.mouseEvents;
		
		var pgNode = this.tree.add(id, pid, dsc, settings, styles, data, eventsHandler);
		pgNode.drawNode = drawNode;
		pgNode.nodeType = type;
		if (node.parameters && node.parameters.length > 0) {
			for (var i=0; i < node.parameters.length; i++) {
				this.addNodetoTree(node.parameters[i], 'parameter', id);
			};
		}
		if (node.subActions && node.subActions.length > 0) {
			for (var i=0; i < node.subActions.length; i++) {
				this.addNodetoTree(node.subActions[i], 'action', id);
			};
		}
		if (node.subOptActions && node.subOptActions.length > 0) {
			for (var i=0; i < node.subOptActions.length; i++) {
				this.addNodetoTree(node.subOptActions[i], 'optAction', id);
			};
		}
		
	};
	
	template.loadXML = function(xmldoc) {
		if (xmldoc.getElementsByTagName('planGraph').length > 0) {
			var data = {}
			var graphNode = xmldoc.getElementsByTagName('planGraph').item(0); 
			// load the agents
			if (graphNode.getElementsByTagName('agents').length > 0) {
				data.agents = [];
				var agentsNode = graphNode.getElementsByTagName('agents').item(0);
	  			var agentNodes = agentsNode.getElementsByTagName('agent');
	  			for (var i = 0; i < agentNodes.length; i++) {
					var id = agentNodes[i].getAttribute('id');
					var agent = {
						'id' : id
					}
					data.agents.push(agent);
				}	
			}
			// load the plan graph XML node
			if (graphNode.getElementsByTagName('root').length > 0) {
				rootNode = graphNode.getElementsByTagName('root').item(0);
				actionNode = this.getChildElementsByTagName(rootNode, 'action')[0];
				data.root = this.loadActionNode(actionNode);
				this.loadData(data);
			}
		}
	};  
	
	template.getChildElementsByTagName = function(node, tagName) {
		childElements = [];
		for (var i=0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].nodeName == tagName) {
				childElements.push(node.childNodes[i]);
			}
		}
		return childElements;
	};
	
	template.loadActionNode = function(actionNode) {
		var node = {}
		node.id = this.nextId;
		this.nextId = this.nextId + 1;
		node.complexity = actionNode.getAttribute('complexity');
		node.name = actionNode.getAttribute('name');
		node.status = actionNode.getAttribute('status');
		node.type = actionNode.getAttribute('type');
		node.beliefs = [];
		var beliefsNode = this.getChildElementsByTagName(actionNode, 'beliefs')[0];
		var beliefNodes = this.getChildElementsByTagName(beliefsNode, 'belief');
		for (var i=0; i < beliefNodes.length; i++) {
			var beliefNode = beliefNodes[i];
			var belief = {};
			belief.agentId = beliefNode.getAttribute('agentId');
			belief.value = beliefNode.childNodes[0].nodeValue;
			node.beliefs.push(belief);
		};
		node.intentions = [];
		var intentionsNode = this.getChildElementsByTagName(actionNode, 'intentions')[0];
		var intentionNodes = this.getChildElementsByTagName(intentionsNode, 'intention');
		for (var i=0; i < intentionNodes.length; i++) {
			var intentionNode = intentionNodes[i];
			var intention = {};
			intention.agentId = intentionNode.getAttribute('agentId');
			intention.value = intentionNode.childNodes[0].nodeValue;
			node.intentions.push(intention);
		};
		node.parameters = [];
		var paramsNode = this.getChildElementsByTagName(actionNode, 'parameters')[0];
		var paramNodes = this.getChildElementsByTagName(paramsNode, 'parameter');
		for (var i=0; i < paramNodes.length; i++) {
			var paramNode = paramNodes[i];
			var param = {};
			param.id = this.nextId;
			this.nextId = this.nextId + 1;
			param.name = paramNode.getAttribute('name');
			param.status = paramNode.getAttribute('status');
			param.type = paramNode.getAttribute('type');
			param.subActions = [];
			var subActionsNode = this.getChildElementsByTagName(paramNode, 'subActions')[0];
			var subActionNodes = this.getChildElementsByTagName(subActionsNode, 'action');
			for (var j=0; j < subActionNodes.length; j++) {
				var subActionNode = subActionNodes[j];
				var subAction = this.loadActionNode(subActionNode);
				param.subActions.push(subAction);
			};
			param.subOptActions = [];
			var subOptActionsNode = this.getChildElementsByTagName(paramNode, 'subOptActions')[0];
			var subOptActionNodes = this.getChildElementsByTagName(subOptActionsNode, 'action');
			for (var j=0; j < subOptActionNodes.length; j++) {
				var subOptActionNode = subOptActionNodes[j];
				var subOptAction = this.loadActionNode(subOptActionNode);
				param.subOptActions.push(subOptAction);
			};
			node.parameters.push(param);
		};
		node.subActions = [];
		var subActionsNode = this.getChildElementsByTagName(actionNode, 'subActions')[0];
		var subActionNodes = this.getChildElementsByTagName(subActionsNode, 'action');
		for (var i=0; i < subActionNodes.length; i++) {
			var subActionNode = subActionNodes[i];
			var subAction = this.loadActionNode(subActionNode);
			node.subActions.push(subAction);
		};
		node.subOptActions = [];
		var subOptActionsNode = this.getChildElementsByTagName(actionNode, 'subOptActions')[0];
		var subOptActionNodes = this.getChildElementsByTagName(subOptActionsNode, 'action');
		for (var i=0; i < subOptActionNodes.length; i++) {
			var subOptActionNode = subOptActionNodes[i];
			var subOptAction = this.loadActionNode(subOptActionNode);
			node.subOptActions.push(subOptAction);
		};
		return node;
	};
	
	template.drawActionNode = function(tree) {
		var style = tree.styles.action.init;
		switch (this.data.status) {
			case 'exec_noRecipe': 
				style = tree.styles.action.init;
				break;
			case 'exec_hasRecipe':
			case 'exec_canBringAbout':
			case 'exec_paramReady':
				style = tree.styles.action.inProgress;
				break;
			case 'exec_success':
				style = tree.styles.action.success;
				break;
			case 'exec_failure':
				style = tree.styles.action.failure;
				break;
		}

		var box = tree.render.rect(this.XPosition, this.YPosition, this.width, this.height, 5).attr(style.box);
		//var label = tree.render.print(this.XPosition + 0.5 * this.width, this.YPosition + 0.5 * this.height, this.dsc, tree.render.getFont("Myriad"), 10);
		var label = tree.render.text(this.XPosition + 0.5 * this.width, this.YPosition + 0.5 * this.height, this.dsc).attr(style.label);
		
		tree.visualElms.push(label);
		tree.elmIDs[tree.visualElms.length-1] = this.id;
		tree.visualElms.push(box);
		tree.elmIDs[tree.visualElms.length-1] = this.id;
		
		var blanket = tree.render.rect(this.XPosition, this.YPosition, this.width, this.height);
		blanket.attr(tree.styles.blanket).toFront();
		tree.blankets.push(blanket);
		tree.blkIDs[tree.blankets.length-1] = this.id;
		
		if (this.eventsHandler) {
			(function (node, tree) {
				for (var idx in tree.blkIDs) {
					if (tree.blkIDs[idx] === node.id) {
						var elm = tree.blankets[idx];
						for (var i = tree.events.length; i--;) {
							elm[tree.events[i]](function(e) {
								node.eventsHandler(node, tree, e);
							});
						}
						break;
					}
				} 
			
			})(this, tree);
		}
	};
	
	template.drawParamNode = function(tree) {
		var style = tree.styles.parameter.notReady;
		switch (this.data.status) {
			case 'param_status_notReady': 
				style = tree.styles.parameter.notReady;
				break;
			case 'param_status_hasValue':
				style = tree.styles.parameter.hasValue;
				break;
			case 'param_status_success':
				style = tree.styles.parameter.success;
				break;
			case 'param_status_fail':
				style = tree.styles.parameter.failure;
				break;
		}
		
		var box = tree.render.rect(this.XPosition, this.YPosition, this.width, this.height, 15);
		box.attr(style.box);
		var label = tree.render.text(this.XPosition + 0.5 * this.width, this.YPosition + 0.5 * this.height, this.dsc);
		label.attr(style.label);
		
		tree.visualElms.push(label);
		tree.elmIDs[tree.visualElms.length-1] = this.id;
		tree.visualElms.push(box);
		tree.elmIDs[tree.visualElms.length-1] = this.id;
		
		var blanket = tree.render.rect(this.XPosition, this.YPosition, this.width, this.height);
		blanket.attr(tree.styles.blanket).toFront();
		tree.blankets.push(blanket);
		tree.blkIDs[tree.blankets.length-1] = this.id;
		
		if (this.eventsHandler) {
			(function (node, tree) {
				for (var idx in tree.blkIDs) {
					if (tree.blkIDs[idx] === node.id) {
						var elm = tree.blankets[idx];
						for (var i = tree.events.length; i--;) {
							elm[tree.events[i]](function(e) {
								node.eventsHandler(node, tree, e);
							});
						}
						break;
					}
				} 
			
			})(this, tree);
		}
		
	};
	
	template.drawOptActionNode = function(tree) {
		var style = tree.styles.action.init;
		
		var box = tree.render.rect(this.XPosition, this.YPosition, this.width, this.height, 5);
		box.attr(style.box);
		var label = tree.render.text(this.XPosition + 0.5 * this.width, this.YPosition + 0.5 * this.height, this.dsc);
		label.attr(style.label);
		
		tree.visualElms.push(label);
		tree.elmIDs[tree.visualElms.length-1] = this.id;
		tree.visualElms.push(box);
		tree.elmIDs[tree.visualElms.length-1] = this.id;
		
		var blanket = tree.render.rect(this.XPosition, this.YPosition, this.width, this.height);
		blanket.attr(tree.styles.blanket).toFront();
		tree.blankets.push(blanket);
		tree.blkIDs[tree.blankets.length-1] = this.id;
		
		if (this.eventsHandler) {
			(function (node, tree) {
				for (var idx in tree.blkIDs) {
					if (tree.blkIDs[idx] === node.id) {
						var elm = tree.blankets[idx];
						for (var i = tree.events.length; i--;) {
							elm[tree.events[i]](function(e) {
								node.eventsHandler(node, tree, e);
							});
						}
						break;
					}
				} 
			
			})(this, tree);
		}
	};
	
	template.drawZoomButtons = function() {
		var circle = this.tree.render.circle(10, 10, 10).attr({fill: "#060606", stroke: "#ffffff", "stroke-width": 2});
		
		var pathString = "M10,10l4,0M10,10l-4,0M10,10l0,4M10,10l0,-4";
		var path = this.tree.render.path(pathString).attr({stroke: "#ffffff", "stroke-width": 2});
		var blanket = this.tree.render.circle(10, 10, 10).attr({stroke: "none", fill: "#fff", opacity: 0});
		(function (pg) {
			blanket.click(function (e) {
				pg.tree.tooltips.remove();
				pg.tree.tooltips = pg.tree.render.set();
				pg.tree.scale(2);
				//pg.tree.render.setZoom(2.0);
			});
		})(this);
		
		circle = this.tree.render.circle(30, 10, 10).attr({fill: "#060606", stroke: "#ffffff", "stroke-width": 2});
		pathString = "M30,10l4,0M30,10l-4,0";
		path = this.tree.render.path(pathString).attr({stroke: "#ffffff", "stroke-width": 2});
		blanket = this.tree.render.circle(30, 10, 10).attr({stroke: "none", fill: "#fff", opacity: 0});
		(function (pg) {
			blanket.click(function (e) {
				pg.tree.tooltips.remove();
				pg.tree.tooltips = pg.tree.render.set();
				//pg.tree.render.setZoom(0.5);
				pg.tree.scale(0.5);
			});
		})(this);
	};
	
	template.mouseEvents = function(node, tree, e) {
		switch(e.type) {
		case 'click':
			node.eventsHandler.onNodeClick(node, tree, e);
			break;
		case 'mouseover':
		case 'mouseout':
			node.eventsHandler.onNodeHover(node, tree, e);
			break;
		}
	};
	
	template.mouseEvents.onNodeClick = function (node, tree, e) {
		switch (node.nodeType) {
		case 'action' : 
			node.eventsHandler.drawActionTooltip(node, tree, e);
			break;
		case 'parameter' : 
			node.eventsHandler.drawParamTooltip(node, tree, e);
			break;
		case 'optAction' : 
			node.eventsHandler.drawOptActionTooltip(node, tree, e);
			break;
		}		
	};
	
	template.mouseEvents.onNodeHover = function(node, tree, e) {
		var boxStyle, labelStyle;
		if (e.type === 'mouseover') {
			boxStyle = tree.styles.boxMouseOver;
			labelStyle = tree.styles.labelMouseOver;
		}
		else if (e.type === "mouseout") {
			boxStyle = tree.styles.boxMouseOut;
			labelStyle = tree.styles.labelMouseOut;
		}
		for (var idx in tree.elmIDs) {
			if (tree.elmIDs[idx] === node.id) {
				var elm = tree.visualElms[idx];
				switch (elm.type) {
					case "rect":
					elm.attr(boxStyle);
					break;
					case "text":
					elm.attr(labelStyle);
					break;
				}
			}
		}
	};
	
	template.mouseEvents.drawActionTooltip = function(node, tree, e) {
		var tipX = (node.XPosition + tree.panOffsetX + 0.5 * node.width) * tree.scaleLevel;
		var tipY = (node.YPosition + tree.panOffsetY + 0.5 * node.height) * tree.scaleLevel;
		var gutter = 10;
		
		var labelW = 80;
		var labelH = 20;
		var cellW = 60;
		var cellH = 20;
		
		
		var beliefs = ["exec_noRecipe", "exec_hasRecipe", "exec_canBringAbout", "exec_paramReady", "exec_success", "exec_failure"];
		var intentions = ["int_unknown", "int_intendTo", "int_intendThat", "int_intendNot", "int_potential"];
		
		var tipW = cellW * tree.data.agents.length + labelW + 2 * gutter;
		var tipH = cellH * beliefs.length + labelH + gutter + cellH * intentions.length + + labelH + 2 * gutter;
		tree.tooltips.remove();
		tree.tooltips = tree.render.set();
		
		frame = tree.render.rect(tipX, tipY, tipW, tipH, 5).attr(tree.styles.tooltip.frame);
		tree.tooltips.push(frame);
		node.eventsHandler.drawBeliefs(node, tree, tipX + gutter, tipY + gutter, cellW, cellH, labelW, labelH, beliefs);
		node.eventsHandler.drawIntentions(node, tree, tipX + gutter, tipY + gutter + cellH * beliefs.length + labelH + gutter, cellW, cellH, labelW, labelH, intentions)
		node.eventsHandler.drawCloseButton(node, tree, tipX + tipW, tipY);
		//node.eventsHandler.drawBeliefGrid(node, tree, gridX, gridY, gridW, gridH);		
	};
	
	template.mouseEvents.drawCloseButton = function(node, tree, x, y) {
		var circle = tree.render.circle(x, y, 10).attr({fill: "#060606", stroke: "#ffffff", "stroke-width": 2});
		tree.tooltips.push(circle);
		var pathString = "M" + x + "," + y + "l3,3";
		pathString +=  "M" + x + "," + y + "l3,-3";
		pathString +=  "M" + x + "," + y + "l-3,3";
		pathString +=  "M" + x + "," + y + "l-3,-3";
		var path = tree.render.path(pathString).attr({stroke: "#ffffff", "stroke-width": 2});
		tree.tooltips.push(path);
		var blanket = tree.render.circle(x, y, 10).attr({stroke: "none", fill: "#fff", opacity: 0});
		tree.tooltips.push(blanket);
		(function (node, tree) {
			blanket.click(function (e) {
				tree.tooltips.remove();
				tree.tooltips = tree.render.set();
			});
		})(node, tree);
	};	
	
	template.mouseEvents.drawBeliefs = function(node, tree, x, y, cellW, cellH, labelW, labelH, beliefs) {
		var cellX, cellY;
		var cell;
		var style = tree.styles.tooltip;
		
		if (tree.data && tree.data.agents && tree.data.agents.length > 0) {
			cellY = y;
			for (var i=0; i < tree.data.agents.length; i++) {
				cellX = x + labelW + i * cellW;
				cell = tree.render.text(cellX + 0.5 * cellW, cellY + 0.5 * cellH, tree.data.agents[i].id).attr(style.label);
				tree.tooltips.push(cell);
			};
			for (var i=0; i < beliefs.length; i++) {
				cellY = y + labelH + i * cellH;
				cellX = x;
				cell = tree.render.text(cellX + 0.5 * labelW, cellY + 0.5 * labelH, beliefs[i]).attr(style.label);
				tree.tooltips.push(cell);
				for (var j=0; j < tree.data.agents.length; j++) {
					cellX = x +labelW + j * cellW;
					cell = tree.render.rect(cellX, cellY, cellW, cellH);
					if (node.eventsHandler.getBeliefById(node, tree.data.agents[j].id) === beliefs[i]) {
						cell.attr(style.mentalState.fill);
					}
					else {
						cell.attr(style.mentalState.empty);
					}
					tree.tooltips.push(cell);
				}				
			}
		}
	};
	
	template.mouseEvents.drawIntentions = function(node, tree, x, y, cellW, cellH, labelW, labelH, intentions) {
		var cellX, cellY;
		var cell;
		var style = tree.styles.tooltip;
		
		if (tree.data && tree.data.agents && tree.data.agents.length > 0) {
			cellY = y;
			for (var i=0; i < tree.data.agents.length; i++) {
				cellX = x + labelW + i * cellW;
				cell = tree.render.text(cellX + 0.5 * cellW, cellY + 0.5 * cellH, tree.data.agents[i].id).attr(style.label);
				tree.tooltips.push(cell);
			};
			for (var i=0; i < intentions.length; i++) {
				cellY = y + labelH + i * cellH;
				cellX = x;
				cell = tree.render.text(cellX + 0.5 * labelW, cellY + 0.5 * labelH, intentions[i]).attr(style.label);
				tree.tooltips.push(cell);
				for (var j=0; j < tree.data.agents.length; j++) {
					cellX = x + +labelW + j * cellW;
					cell = tree.render.rect(cellX, cellY, cellW, cellH);
					if (node.eventsHandler.getIntentionById(node, tree.data.agents[j].id) === intentions[i]) {
						cell.attr(style.mentalState.fill);
					}
					else {
						cell.attr(style.mentalState.empty);
					}
					tree.tooltips.push(cell);
				}				
			}
		}
	};
	template.mouseEvents.getBeliefById = function(node, agentId) {
		for (var i=0; i < node.data.beliefs.length; i++) {
			if (node.data.beliefs[i].agentId == agentId) {
				return node.data.beliefs[i].value;
			}
		}
	};
	template.mouseEvents.getIntentionById = function(node, agentId) {
		for (var i=0; i < node.data.intentions.length; i++) {
			if (node.data.intentions[i].agentId == agentId) {
				return node.data.intentions[i].value;
			}
		}
	};
	return PG;
})();