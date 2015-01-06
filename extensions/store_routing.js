/* **************************************************************

   Copyright 2013 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

************************************************************** */




var store_routing = function(_app) {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 

				//shows search result for any product with the tag passed and the is_app attribute
				_app.router.addAlias('apptagsearch', 		function(routeObj){
					var tag = routeObj.params.tag.toUpperCase(); 
					showContent('search',{'elasticsearch':{'filter':{'and':{'filters':[{'term':{'tags':tag}},{'term':{'is_app':'1'}}]}}}})
				});
				//shows search results for any product with the attribute that is passed and set to "1", and the is_app attribute
				_app.router.addAlias('appattribsearch',		function(routeObj){
					var elasticsearch = {'filter':{'and':[{'term':{'is_app':'1'}}]}};
					var fObj = {'term':{}};
					fObj.term[routeObj.params.attrib] = '1';
					elasticsearch.filter.and.push(fObj);
					showContent('search',{'elasticsearch':elasticsearch});
				});


				_app.router.appendHash({'type':'exact','route':'/','callback':'homepage'});
				_app.router.appendHash({'type':'match','route':'apptag/{{tag}}*','callback':'apptagsearch'}); //elastic search for tag plus is_app
				_app.router.appendHash({'type':'match','route':'appattrib/{{attrib}}*','callback':'appattribsearch'}); //elastic search for attrib plus is_app
				r = true;

				return r;
				},
			onError : function()	{
				_app.u.dump('BEGIN store_routing.callbacks.init.onError');
				}
				dump("START store_routing.callbacks.attachEventHandlers.onSuccess");
				$.merge(_app.ext.seo_robots.vars.pages,[
	//TODO: Check if there are any more cusome pages that need to be added to robots_seo
					"#!company/about/",
					"#!company/contact/"
				]);
				var callback = function(event, $context, infoObj) {
					dump("--> store_routing complete event");
					event.stopPropagation();
					if(infoObj) {
						var hash = "";
						var $routeEle = $('[data-routing-hash]',$context);
						if($routeEle.length) {
							dump('Whadda you know... there was a routing element');
							hash = $routeEle.attr('data-routing-hash');
						else {
							switch(infoObj.pageType) { //for bmo: make all url's lower case.
								case 'homepage':
									hash = "#!/";
									break;
								case 'product':
									//for bmo: append prod_name.html to end of hash
									hash = "#!/product/"+infoObj.pid.toLowerCase()+"/"+infoObj.name;
									break;
								case 'category':
									dump('There was no routing element');
									hash = "#!/category/"+infoObj.navcat.toLowerCase()+"/";
									break;
								case 'static':
									hash = window.location.hash;
									break;
								case 'search':
									hash = window.location.hash.toLowerCase(); //"#!/search/"+encodeURIComponent(infoObj.KEYWORDS)+"/"
									break;
								case 'company':
									hash = "#!company/"+infoObj.show.toLowerCase()+"/"
									break;
								case 'customer':
									hash = "#!customer/"+infoObj.show.toLowerCase()+"/";
									break;
								case 'cart':
									hash = "#!cart/";
									break;
								case 'checkout':
									hash = "#!checkout/";
									break;
/*	TODO: FIND OUT IF SPECIAL PAGE TYPE FOR FILTER SEARCH CATEGORY IS AVAILABLE									
											_app.templates.categoryTemplateFilteredSearch.on('complete.routing', function(event, $context, infoObj){
												var hash = "";
												var $routeEle = $('[data-routing-hash]',$context)
												if($routeEle.length){
													hash = $routeEle.attr('data-routing-hash');
													}
												else {
													hash = "#!/category/"+infoObj.navcat+"/";
												}
												_app.ext.store_routing.u.setHash(hash);
												});
*/
							}
						}
						_app.ext.store_routing.u.setHash(hash);
					}
				}
				for(var i in _app.templates) {
					_app.templates[i].on('complete.routing',callback);
				}
				$('#appTemplates').children().each(function(){
					$(this).on('complete.routing',callback);
				});
		
				
			},
		}	
	}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		
		tlcFormats : {
			productlink : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				if(args.pid && args.seo){
					data.globals.binds[data.globals.focusBind] =  _app.ext.store_routing.u.productAnchor(args.pid, args.seo);
					return true;
					} 
				else {
					dump('-> store_routing productlink tlcformat: The PID or SEO content was not provided in the tlc.');
					//stop execution of the commands.  throw a tantrum.
					return false;
					}
				},

/*
optional params:
	type -> acceptable values are product, category, dwiw or blank (blank = dwiw). set implicitly for best results.
		 -> if blank/dwiw, type is guessed.
	seo -> supported for both category and product, will append /product pretty name or /category pretty name (uri encoded) to the end of the href.
*/
			seoanchor : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals), r;
				if(!args.type || args.type == 'dwiw')	{
					if(data.value.pid)	{args.type = 'product'}
					else if(data.value.path)	{args.type = 'category'}
					else	{}
					}

				switch(args.type) {
					case 'product':
						r = true;
						var seoname = '';
						if(args.seoname)	{
							seoname = args.seoname;
							}
						//seoname isn't clearly defined, so we go into some dwiw guesswork.
						else if(args.seo && data.value['%attribs'])	{ 
							seoname = data.value['%attribs']['zoovy:prod_seo_title'] || data.value['%attribs']['zoovy:prod_name'] || ''; //this would be a product list.
							}
						else if(args.seo && data.value.prod_name)	{
							seoname = data.value.prod_name; //this would be an elastic search results.
							}
						else	{} //not defined. guesswork came back negative.
						data.globals.binds[data.globals.focusBind] = _app.ext.store_routing.u.productAnchor(data.value.pid, seoname);
						break;
					
					case 'category':
						r = true;
						var seo = args.seo || data.value.pretty;
						data.globals.binds[data.globals.focusBind] = _app.ext.store_routing.u.categoryAnchor(data.value.path, seo);
						break;
					
					default:
						dump("in tlcFormat.seolink, the type specified ["+args.type+"] is not recognized.");
						r = false; //unrecognized 'type'
					}
				return r;
				} //seolink

			},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			setHash : function(hash){
				dump('setting hash to: '+hash);
				var $canonical = $('link[rel=canonical]');
				if(!$canonical.length){
					dump('NO CANONICAL IN THE DOCUMENT'); dump(hash);
					$canonical = $('<link rel="canonical" href="" />');
					$('head').append($canonical);
				}
				$canonical.attr('href',hash);
				if(_app.vars.showContentHashChange) {
				},
			cleanURIComponent : function(str){
				var component = str.replace(/^\s+|\s+$/g, '');
				//component = component.replace(' ', '-');
				component = component.replace(/[^a-zA-Z0-9]+/g, '-');
				return component;
				},
	//for bmo: make hash lower case.
			productAnchor : function(pid, seo){
				//for bmo: append .html to end of seo. 
				return "#!product/"+pid.toLowerCase()+"/"+(seo ? _app.ext.store_routing.u.cleanURIComponent(seo).toLowerCase() : '')+".html";
				},
			categoryAnchor : function(path,seo)	{
				return "#!category/"+path.toLowerCase()+"/"+((seo) ? _app.ext.store_routing.u.cleanURIComponent(seo).toLowerCase() : '');
					path = path.substr(1);
					}
				return "/category/"+path+"/"+((seo) ? _app.ext.store_routing.u.cleanURIComponent(seo) : '');
				},
			searchAnchor : function(type,value)	{
				var r;
				if(type == 'tag')	{
					r = '#!search/tag/'+value.toLowerCase();
					}
				else if(type == 'keywords')	{
					r = '#!search/keywords/'+value.toLowerCase();
					}
// ### FUTURE -> support ability to search for a match on a specific attribute.
//				else if(type == 'attrib')	{
//					r = '/search/attrib/' ... some key value pair.
//					}
				else	{
					//unrecognized type
					}
				return "#!category/"+path.toLowerCase()+"/"+((seo) ? _app.ext.store_routing.u.cleanURIComponent(seo).toLowerCase() : '');
				}
			}, //u [utilities]

		e : {
/*			
			navigateTo : function($ele,P)	{
				if($ele.data('type'))	{
					switch($ele.data('type'))	{
						case 'product':
							document.location.hash = _app.ext.store_routing.u.productAnchor($ele.data('pid'));
							break;
						case 'category':
							document.location.hash = _app.ext.store_routing.u.categoryAnchor($ele.data('path'));
							break;
						default:
							$("#globalMessaging").anymessage({"message":"In store_router.e.navigateTo, invalid data.type ["+$ele.data('type')+"] on trigger element.","gMessage":true});
						}
					}
				else	{
					
					}
				}
*/
			} //e [app Events]
		} //r object.
	return r;
	}
