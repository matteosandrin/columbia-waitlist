mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGVvc2FuZHJpbiIsImEiOiJjajE5dHFrNTgwMDY5MnFxbXBldzA2aTliIn0.KHzhRZCopAziY_O0CJxPPw';
var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/dark-v9',
		zoom: 12,
		center: [-73.983858,40.7497247],
		maxBounds: [[-74.2495941,40.5765633],[-73.4797139,41.0469793]]	
		});

map.on('load', function () {

	var consumer = new soda.Consumer('data.cityofnewyork.us',{ apiToken: "QwAD6jBHYouRDiYnlIiTQ2irh" });

	function getDateString(date) {
		date.setFullYear(2015);
		var tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
		return ((new Date(date - tzoffset)).toISOString().slice(0,-5));
	}

	var now = new Date();
	var then = new Date();
	then.setMinutes(then.getMinutes() + 10);

	var nowString = getDateString(now);
	var thenString = getDateString(then);


	var where = "dropoff_datetime between \'" + nowString + "\' and \'" + thenString + "\'";
	console.log(where);

	consumer.query()
	  .withDataset('2yzn-sicd')
	  .where(where)
	  .order('dropoff_datetime ASC')
	  .limit(10)
	  .getRows()
	    .on('success', drawRows)
	    .on('error', function(error) { console.error(error); });

});

var taxis = [];



function drawRows(rows){

	console.log(rows);

	console.log("Total # of taxis: " + rows.length);

	var directionsService = new google.maps.DirectionsService;
	rows.forEach(function (row, index) {
		
		var taxi = {};
		taxi.i = index;

		setTimeout(function(){

			directionsService.route({
			          origin: new google.maps.LatLng({lat: parseFloat(row.pickup_latitude), lng: parseFloat(row.pickup_longitude)}),
			          destination: new google.maps.LatLng({lat: parseFloat(row.dropoff_latitude), lng: parseFloat(row.dropoff_longitude)}),
			          travelMode: 'DRIVING'
			        }, function(response, status) {
				        if (status === 'OK') {
				            var google_poly = response.routes[0].overview_polyline;
				            var mapbox_poly = polyline.decode(google_poly);
				            mapbox_poly = mapbox_poly.map(function (pair, a) {
				            	return [pair[1],pair[0]];
				            });

				            taxi.route = {
							    "type": "FeatureCollection",
							    "features": [{
							        "type": "Feature",
							        "geometry": {
							            "type": "LineString",
							            "coordinates": mapbox_poly
							        }
							    }]
							};

							taxi.point = {
							    "type": "FeatureCollection",
							    "features": [{
							        "type": "Feature",
							        "geometry": {
							            "type": "Point",
							            "coordinates": mapbox_poly[0]
							        }
							    }]
							};

							taxi.total_distance = turf.lineDistance(taxi.route.features[0], 'meters');
							taxi.total_time = (new Date(row.dropoff_datetime)) - (new Date(row.pickup_datetime));
							taxi.average_speed =  taxi.total_distance / (taxi.total_time / 1000); // in meters/second
							taxi.frame_number = Math.ceil(taxi.total_time / 1000 / 5); // one frame every 10 secs of driving
							taxi.frames = Array.apply(null, Array(taxi.frame_number));
							

							taxi.current_progress = 0;

							

							taxi.frames = taxi.frames.map(function (frame, b){
								taxi.current_progress += 5 * taxi.average_speed;
								return turf.along(taxi.route.features[0], taxi.current_progress, 'meters').geometry.coordinates;
							});

							taxi.counter = 0

							taxi.fps = 10;
							taxi.now = 0;
							taxi.then = Date.now();
							taxi.interval = 1000/taxi.fps;
							taxi.delta = 0;
							taxi.done = false;

							map.addSource('route-'+taxi.i, {
						        "type": "geojson",
						        "data": taxi.route
						    });

						    map.addSource('point-'+taxi.i, {
						        "type": "geojson",
						        "data": taxi.point
						    });

							// map.addLayer({
						 //        "id": "route-" + taxi.i,
						 //        "source": "route-" + taxi.i,
						 //        "type": "line",
						 //        "paint": {
						 //            "line-width": 2,
						 //            "line-color": "#007cbf"
						 //        }
						 //    });

						    map.addLayer({
						        "id": "point-" + taxi.i,
						        "source": "point-" + taxi.i,
						        "type": "circle",
						        "paint": {
						            "circle-radius": 5,
						            "circle-color": "#FFF"
						        }
						    });

						    // requestAnimationFrame(taxi.animate);
						    taxis.push(taxi);

						    console.log("loaded taxi #" + (index + 1));

						    if (index == rows.length - 1) {

								requestAnimationFrame(animate);

						    }

						} else {
							console.log('Directions request failed due to ' + status);
						}
				});

		}, index * 700);
	
	});

}

function animate() {

	var all_done = taxis.map(function (t,b) {return t.done}).reduce(function(a, b) { return a + b; }, 0);

	if (all_done != taxis.length) {
		requestAnimationFrame(animate);
	} else {
		console.log("all done.");
	}
	

	taxis.forEach(function (taxi,c){

		taxi.now = Date.now();
		taxi.delta = taxi.now - taxi.then

		if (taxi.delta > taxi.interval) {

			if (taxi.counter < taxi.frame_number) {

				taxi.then = taxi.now - (taxi.delta % taxi.interval);

				taxi.point.features[0].geometry.coordinates = taxi.frames[taxi.counter];
				map.getSource('point-' + taxi.i).setData(taxi.point);
				taxi.counter++;

			}else{
				taxi.done = true;
			}

		}

	});

}


