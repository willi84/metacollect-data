// create module for custom directives
var d3DemoApp = angular.module('d3DemoApp', ['times.tabletop'])
	.config(function (TabletopProvider) {
		TabletopProvider.setTabletopOptions({
			//key: 'https://docs.google.com/spreadsheets/d/1dbctJiD3W2tLbo_bn9VjHnjQJgp5qVZc3bbBJ1dT-0k/pubhtml?gid=1052587333&single=true', // Your key here.
			key: 'https://docs.google.com/spreadsheets/d/1XMpzyQizxfLEIRDs0cRUgJfSHUhGMw0ojDjK50EoZys/pubhtml?gid=1052587333&single=true',
			simpleSheet: true // Any Tabletop option except 'callback' works.
		});
	})
	// controller business logic
	.controller('AppCtrl', ['$scope', '$http', 'Tabletop', function AppCtrl($scope, $http, Tabletop) {


		// verschiedene Layer, default: places


		// initialize the model
		$scope.user = 'angular';
		$scope.repo = 'angular.js';
		$scope.firstChar = 'a';



		// helper for formatting date
		var humanReadableDate = function (d) {
			return d.getUTCMonth() + 1 + '/' + d.getUTCDate();
		};

		// helper for reformatting the Github API response into a form we can pass to D3
		var reformatGithubResponse = function (data) {
			// sort the data by author date (rather than commit date)
			data.sort(function (a, b) {
				if (new Date(a.commit.author.date) > new Date(b.commit.author.date)) {
					return -1;
				} else {
					return 1;
				}
			});

			// date objects representing the first/last commit dates
			var date0 = new Date(data[data.length - 1].commit.author.date);
			var dateN = new Date(data[0].commit.author.date);

			// the number of days between the first and last commit
			var days = Math.floor((dateN - date0) / 86400000) + 1;

			// map authors and indexes
			var uniqueAuthors = []; // map index -> author
			var authorMap = {}; // map author -> index
			data.forEach(function (datum) {
				var name = datum.commit.author.name;
				if (uniqueAuthors.indexOf(name) === -1) {
					authorMap[name] = uniqueAuthors.length;
					uniqueAuthors.push(name);
				}
			});

			// build up the data to be passed to our d3 visualization
			var formattedData = [];
			formattedData.length = uniqueAuthors.length;
			var i, j;
			for (i = 0; i < formattedData.length; i++) {
				formattedData[i] = [];
				formattedData[i].length = days;
				for (j = 0; j < formattedData[i].length; j++) {
					formattedData[i][j] = {
						x: j,
						y: 0
					};
				}
			}
			data.forEach(function (datum) {
				var date = new Date(datum.commit.author.date);
				var curDay = Math.floor((date - date0) / 86400000);
				formattedData[authorMap[datum.commit.author.name]][curDay].y += 1;
				formattedData[0][curDay].date = humanReadableDate(date);
			});

			// add author names to data for the chart's key
			for (i = 0; i < uniqueAuthors.length; i++) {
				formattedData[i][0].user = uniqueAuthors[i];
			}

			return formattedData;
		};

		$scope.getCommitData = function () {

			/*Tabletop.then(function success(ttdata){
				//console.log(ttdata);
				localStorage.setItem('data', JSON.stringify(ttdata[0]));
				console.log(localStorage.getItem('data'));
				console.log('get');
					$scope.data = ttdata[0] || localStorage.getItem('data');
					$scope.categories = [];
			
				$scope.layer = {
					name: 'places'
				};
			
					
			});*/
			$scope.data = JSON.parse(localStorage.getItem('data'));
			$scope.layer = {
				name: 'places'
			};
			/*$http({
				method: 'GET',
				//url:'https://api.github.com/repos/' +
				url: './data/fallback.json',
			//	url: 'http://213.187.84.22:3000/items', //?limit=10000&offset=0',
				dataType: "json",
			headers: {
			//	headers:{Accept:"application/json","X-Auth-Token":f.authToken},paramSerializer:"$httpParamSerializerJQLike",timeout:j.promise}
					"Content-Type": "application/json",
					"Accept":  "application/json"
	
			}
				//url: 'https://spreadsheets.google.com/feeds/list/1dbctJiD3W2tLbo_bn9VjHnjQJgp5qVZc3bbBJ1dT-0k/od6/public/basic?alt=json&gid=1052587333&single=true',
				//url: '//django.dsini20.schedar.uberspace.de/api/search/project?format=json&title*istartswith=' + $scope.firstChar
				  
			})
			.then(function successCallback(response) {
				console.log(response);
				$scope.data = response.data[0];
			$scope.categories = [];
	
		$scope.layer = {
			name: 'places'
		};
			 // attach this data to the scope
				//data = response.data.feed.entry;
	
				// clear the error messages
		}, function errorCallback(response) {
		  
		});*/

		};

		// get the commit data immediately
		$scope.getCommitData();
	}]);

d3DemoApp.directive('ghVisualization', function () {


	return {
		restrict: 'E',
		scope: {
			val: '=',
			layer: '=',
			grouped: '=',
			place: '=',
			categroy: '='
		},
		link: function (scope, element, attrs) {


			// constants
			var marginA = 20,
				widthA = 960,
				heightA = 500 - .5 - marginA,
				colorA = d3.interpolateRgb("#f77", "#77f");

			let svg = d3.select(element[0])
				.append("svg")
				.attr("width", widthA)
				.attr("height", heightA + marginA + 100);

			scope.$watch('layer', function (newwVal, oldVal) {
				console.log('layer');

				newVal = scope.val;
				if (!newVal) {
					return;
				}
				/*	$scope.$watch('layer.name', function(value) {
					switch(value){
						case 'places':
						//	$scope.data = ttdata[0];
							break;
						case 'categories':
							//$scope.data = {};
							break;
						case 'category':
						default: break;
					}
			});*/

				// clear the elements inside of the directive
				svg.selectAll('*').remove();

				// if 'val' is undefined, exit
				if (!newwVal) {
					return;
				}
        /*if (!newVal) {
          return;
        }*/
				// set up initial svg object
				/* var vis = d3.select(element[0])
					 .append("svg")
						 .attr("width", width)
						 .attr("height", height + margin + 100);*/

				var ort = {
					'Category': '',
					'size': 60,
					'Title': 'Berliner',
					'Description (EN)': '',
					'Where founded': 'Berlin',
					'type': 'top'
				}
				/*console.log(newVal.length);
				var teil1 = newVal.splice(0, Math.floor(newVal.length/2));
				console.log(newVal.length);
				var teil2 = newVal.splice(Math.floor(newVal.length/2), newVal.length);
				console.log(teil1);
				console.log(teil2);*/
				newVal.splice(Math.floor(newVal.length / 2), 0, ort);


				let width = svg.property('clientWidth'); // get width in pixels
				let height = +svg.attr('height');
				let centerX = width * 0.5;
				let centerY = height * 0.5;
				let strength = 0.05;
				let focusedNode;

				let format = d3.format(',d');

				let scaleColor = d3.scaleOrdinal(d3.schemeCategory20);
				//console.log(d3.schemeCategory20);

				// use pack to calculate radius of the circle
				let pack = d3.pack()
					.size([width, height])
					.padding(1.5);

				let forceCollide = d3.forceCollide(d => d.r + 1);

				// use the force
				let simulation = d3.forceSimulation()
					// .force('link', d3.forceLink().id(d => d.id))
					.force('charge', d3.forceManyBody())
					.force('collide', forceCollide)
					// .force('center', d3.forceCenter(centerX, centerY))
					.force('x', d3.forceX(centerX).strength(strength))
					.force('y', d3.forceY(centerY).strength(strength));

				//let sizes = [10,20,30,40,50,60,70,80,90,100];
				let sizes = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
				let subCategories = ['a', 'b', 'c'];

				// reduce number of circles on mobile screen due to slow computation
				if ('matchMedia' in window && window.matchMedia('(max-device-width: 767px)').matches) {
					newVal = newVal.filter(el => {
						return sizes[Math.floor((Math.random() * 10) + 1)] >= 50;
					});
				}
				let root = d3.hierarchy({ children: newVal })
					.sum(d => {
						return d.size || sizes[Math.floor((Math.random() * 10))]
					}); //d.value);


				// we use pack() to automatically calculate radius conveniently only
				// and get only the leaves


				let nodes = pack(root).leaves().map(node => {
					let data = node.data;
					/*const dataNode = data.content.$t.match(/([^\:])*:\s[^\,]*,/ig);
					dataNode.forEach(function(element) {
						console.log(element);
						'wherefounded', 'link', 'descriptionen', 'type', 'category', 'transittordestinationd', 'founded', 'activityfeb-mar2016', 'activityjune2016', 'runby', 'partnerssupporters'
						
					}, this);*/
					//const cat = data.topics[0]; 
					let places = '';
					let place = ''
					if (data.type && data.type !== undefined) {
						places = ['foobar'];
						place = 'foobar'
					} else {
						places = data['Where founded'].match(/(Berlin|München|Nürnberg|Dresden|Nürnberg|Leipzig|Paderborn|Hofsingelding|Paderborn|Gießen|Saarbrücken|Duisburg|Deggendorf|Hamburg|Potsdam|Witten|Rosenheim)/);
						place = (places && places.length > 0) ? places[0] : 'Woanders';
					}

					let cat = '';
					let size = 20;
					switch (scope.layer) {
						case 'places':
							place = (places && places.length > 0) ? places[0] : 'Woanders';
							cat = place;
							let size = (data.size) ? 60 : 20;
							break;
						case 'categories':
							cat = data.Category || 'foobar'; //(data.categories &&  data.categories.length > 0) ? data.categories[0].name : 'foobar';
							break;
						case 'category':
							cat = subCategories[Math.floor((Math.random() * subCategories.length))];
							break;
						default:
							break;
					}
					return {
						x: centerX + (node.x - centerX) * 3, // magnify start position to have transition to center movement
						y: centerY + (node.y - centerY) * 3,
						r: 0, // for tweening
						radius: node.r, //original radius
						id: cat + '.' + (data.Title.replace(/\s/g, '-')),
						//id: cat + '.' + (data.title.replace(/\s/g, '-')),
						cat: cat,
						category: data.Category,
						name: data.Title,
						//name: data.title,
						//place: place ? place[0] :  'other',
						place: place,
						value: data.size || sizes[Math.floor((Math.random() * 10) + 1)], //data.value,
						//value: sizes[0],
						icon: '', //icon: 'http://metacollect.org/wp-content/uploads/2016/12/mc-logo.png',
						//desc: data.definitions.de 
						desc: data['Description (EN)'] //data.description_de,
					};
				});
				function ticked() {
					node
						.attr('transform', d => `translate(${d.x},${d.y})`)
						.select('circle')
						.attr('r', d => d.r);
				}
				simulation.nodes(nodes).on('tick', ticked);

				svg.style('background-color', '#eee');

				/*let node = svg.selectAll(".node")
					.data(nodes) //.descendants())
					.enter()
					.append("g")
						.attr("class", function(d) {  return d.name  ? "node" : "leaf node children"; })
						.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })

				node.append("title")
      .text(function(d) { return "yy"+d.name  });

  node.append("circle")
      .attr("r", function(d) { return d.value; });
      //.text(function(d) { return "xx"+d.data.name + "\n" + format(d.value); });


  node.filter(function(d) { return !d.children; }).append("text")
      //.attr("dy", "0.3em")
      .text(function(d) { return d.name.substring(0, d.value / 3); });

					*/	
				// old
				let node = svg.selectAll('.node')
					.data(nodes)
					.enter().append('g')
					.attr('class', 'node')
					.call(d3.drag()
						.on('start', (d) => {
							if (!d3.event.active) { simulation.alphaTarget(0.2).restart(); }
							d.fx = d.x;
							d.fy = d.y;
						})
						.on('drag', (d) => {
							d.fx = d3.event.x;
							d.fy = d3.event.y;
						})
						.on('end', (d) => {
							if (!d3.event.active) { simulation.alphaTarget(0); }
							d.fx = null;
							d.fy = null;
						}));

				node.filter(d => {
					switch (scope.layer) {
						case 'categories':
							//return true;
							return d.place === 'Berlin';
						case 'places':
							return true;
						case 'category':
							return d.category === 'Jobs';
						default:
							return true;
					}
				}
					//d.place === 'Berlin'}
				).append('circle')
					.attr('id', d => d.id)
					.attr('r', 0)
					.style('fill', d => scaleColor(d.cat))
					.transition().duration(2000).ease(d3.easeElasticOut)
					.tween('circleIn', (d) => {
						let i = d3.interpolateNumber(0, d.radius);
						return (t) => {
							d.r = i(t);
							simulation.force('collide', forceCollide);
						};
					});

				node.append('clipPath')
					.attr('id', d => `clip-${d.id}`)
					.append('use')
					.attr('xlink:href', d => `#${d.id}`);

				// display text as circle icon
				node.filter(d => { (d.index) }) //.includes('img/') )
					.append('text')
					.text(function (d, i) { return d['index']; })
					.classed('node-icon', true)
					.attr('clip-path', d => `url(#clip-${d.id})`)
					.selectAll('tspan')
					.data(d => d.index)
					.enter()
					.append('tspan')
					.attr('x', 0)
					.attr('y', (d, i, nodes) => (13 + (i - nodes.length / 2 - 0.5) * 10))
					//.text(d);

				// display image as circle icon
				node.filter(d => String(d.icon)) //.includes('img/'))
					.append('image')
					.classed('node-icon', true)
					.attr('clip-path', d => `url(#clip-${d.id})`)
					.attr('xlink:href', d => d.icon)
					.attr('x', d => -d.radius * 0.7)
					.attr('y', d => -d.radius * 0.7)
					.attr('height', d => d.radius * 2 * 0.7)
					.attr('width', d => d.radius * 2 * 0.7);
				
				node.append('title')
					.text(d => (d.cat + '::' + d.name + '\n' + format(d.value)));


				// creates category cirles
				let legendOrdinal = d3.legendColor()
					.scale(scaleColor)
					.shape('circle');

				svg.append('g')
					//	.classed('legend-color', true)
					.attr('text-anchor', 'start')
					.attr('transform', 'translate(20,30)')
					.style('font-size', '42px')
				// legend 1
				svg.append('g')
					.classed('legend-color', true)
					.attr('text-anchor', 'start')
					.attr('transform', 'translate(20,30)')
					.style('font-size', '12px')
					.call(legendOrdinal);

				let sizeScale = d3.scaleOrdinal()
					.domain(['less use', 'more use'])
					.range([5, 10]);

				let legendSize = d3.legendSize()
					.scale(sizeScale)
					.shape('circle')
					.shapePadding(10)
					.labelAlign('end');

				// legend 2
				svg.append('g')
					.classed('legend-size', true)
					.attr('text-anchor', 'start')
					.attr('transform', 'translate(150, 25)')
					.style('font-size', '12px')
					.call(legendSize);


				/*
				<foreignObject class="circle-overlay" x="10" y="10" width="100" height="150">
					<div class="circle-overlay__inner">
						<h2 class="circle-overlay__title">ReactJS</h2>
						<p class="circle-overlay__body">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ullam, sunt, aspernatur. Autem repudiandae, laboriosam. Nulla quidem nihil aperiam dolorem repellendus pariatur, quaerat sed eligendi inventore ipsa natus fugiat soluta doloremque!</p>
					</div>
				</foreignObject>
				*/
				let infoBox = node.append('foreignObject')
					.classed('circle-overlay hidden', true)
					.attr('x', -350 * 0.5 * 0.8)
					.attr('y', -350 * 0.5 * 0.8)
					.attr('height', 350 * 0.8)
					.attr('width', 350 * 0.8)
					.append('xhtml:div')
					.classed('circle-overlay__inner', true);

				infoBox.append('h2')
					.classed('circle-overlay__title', true)
					.text(d => d.name);

				infoBox.append('p')
					.classed('circle-overlay__body', true)
					.html(d => d.desc);
				infoBox.append('p')
					.classed('circle-overlay__body', true)
					.html(d => d.place);


				node.on('click', (currentNode) => {
					switch (scope.$parent.layer.name) {
						case 'places':
							scope.place = currentNode.place;
							scope.category = '';
							scope.$parent.layer.name = 'categories'
							break;
						case 'categories':
							scope.category = currentNode.category;
							scope.$parent.layer.name = 'category'
							break;
						default:
							break;
					}
					scope.$apply();
					if (scope.$parent.layer.name !== 'category') {
						return;
					}

					d3.event.stopPropagation();
					let currentTarget = d3.event.currentTarget; // the <g> el

					if (currentNode === focusedNode) {
						// no focusedNode or same focused node is clicked
						return;
					}
					let lastNode = focusedNode;
					focusedNode = currentNode;

					simulation.alphaTarget(0.2).restart();
					// hide all circle-overlay
					d3.selectAll('.circle-overlay').classed('hidden', true);
					d3.selectAll('.node-icon').classed('node-icon--faded', false);

					// don't fix last node to center anymore
					if (lastNode) {
						lastNode.fx = null;
						lastNode.fy = null;
						node.filter((d, i) => i === lastNode.index)
							.transition().duration(2000).ease(d3.easePolyOut)
							.tween('circleOut', () => {
								let irl = d3.interpolateNumber(lastNode.r, lastNode.radius);
								return (t) => {
									lastNode.r = irl(t);
								};
							})
							.on('interrupt', () => {
								lastNode.r = lastNode.radius;
							});
					}

					// if (!d3.event.active) simulation.alphaTarget(0.5).restart();

					// focus node
					d3.transition().duration(2000).ease(d3.easePolyOut)
						.tween('moveIn', () => {
							let ix = d3.interpolateNumber(currentNode.x, centerX);
							let iy = d3.interpolateNumber(currentNode.y, centerY);
							let ir = d3.interpolateNumber(currentNode.r, centerY * 0.5);
							return function (t) {
								currentNode.fx = ix(t);
								currentNode.fy = iy(t);
								currentNode.r = ir(t);
								simulation.force('collide', forceCollide);
							};
						})
						.on('end', () => {
							simulation.alphaTarget(0);
							let $currentGroup = d3.select(currentTarget);
							$currentGroup.select('.circle-overlay')
								.classed('hidden', false);
							$currentGroup.select('.node-icon')
								.classed('node-icon--faded', true);

						})
						.on('interrupt', () => {
							currentNode.fx = null;
							currentNode.fy = null;
							simulation.alphaTarget(0);
						});
				});
			});

			// blur
			d3.select(svg).on('click', () => {
				let target = d3.event.target;
				// check if click on document but not on the circle overlay
				if (!target.closest('#circle-overlay') && focusedNode) {
					focusedNode.fx = null;
					focusedNode.fy = null;
					simulation.alphaTarget(0.2).restart();
					d3.transition().duration(2000).ease(d3.easePolyOut)
						.tween('moveOut', function () {
							let ir = d3.interpolateNumber(focusedNode.r, focusedNode.radius);
							return function (t) {
								focusedNode.r = ir(t);
								simulation.force('collide', forceCollide);
							};
						})
						.on('end', () => {
							focusedNode = null;
							simulation.alphaTarget(0);
						})
						.on('interrupt', () => {
							simulation.alphaTarget(0);
						});

					// hide all circle-overlay
					d3.selectAll('.circle-overlay').classed('hidden', true);
					d3.selectAll('.node-icon').classed('node-icon--faded', false);

				}


			});




		}
	}
});