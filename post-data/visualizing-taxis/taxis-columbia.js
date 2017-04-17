// also show a tally of th number of pickups and dropoffs

var sw_corner = [-73.980107, 40.799757]; // [longitude, latitude]
var ne_corner = [-73.943775, 40.815293]; // [longitude, latitude]
var columbia_center = [-73.961906,40.808210];
var columbia_map_bounds = [sw_corner,ne_corner];
var real_seconds_per_frame = 5;
var delta = 60 * 60 / real_seconds_per_frame;
var delete_after_frames = 25;
var dot_radius = 15;
var now = moment().year(2015);
var then = moment().year(2015).add(delta * real_seconds_per_frame, 'seconds');
var realTime = now;
$(".display-date").text(realTime.format("MMMM Do YYYY"));
$(".display-time").text(realTime.format("h:mm a"));

var frames = Array.apply(null, Array(delta));

point = {
			"type": "FeatureCollection",
			"features": [{
				"type": "Feature",
				"geometry": {
					"type": "Point",
					"coordinates": []
				}
			}]
		};

mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGVvc2FuZHJpbiIsImEiOiJjajE5dHFrNTgwMDY5MnFxbXBldzA2aTliIn0.KHzhRZCopAziY_O0CJxPPw';
var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/dark-v9',
		zoom: 12,
		center: columbia_center,
		maxBounds: columbia_map_bounds,
		interactive: false
		});

map.on('load', function () {

	var consumer = new soda.Consumer('data.cityofnewyork.us',{ apiToken: "QwAD6jBHYouRDiYnlIiTQ2irh" });

	var nowString = now.format().slice(0,-6);
	var thenString = then.format().slice(0,-6);

	var pickup_time_clause = "(pickup_datetime between \'" + nowString + "\' and \'" + thenString + "\')";
	var dropoff_time_clause = pickup_time_clause.replace("pickup","dropoff");
	var pickup_pos_clause = "(pickup_longitude >= " + sw_corner[0] + " AND pickup_longitude < "  + ne_corner[0] + " AND pickup_latitude > " + sw_corner[1] + " AND pickup_latitude < " + ne_corner[1] + ")";
	var dropoff_pos_clause = pickup_pos_clause.replace("pickup","dropoff");

	var where = "(" +  pickup_time_clause + " OR " + dropoff_time_clause + ") AND (" +  pickup_pos_clause + " OR " + dropoff_pos_clause + ")";

	console.log(where);

	consumer.query()
	  .withDataset('2yzn-sicd')
	  .where(where)
	  .order('dropoff_datetime ASC')
	  // .limit()
	  .getRows()
		.on('success', drawRows)
		.on('error', function(error) { console.error(error); });

});

function drawRows(rows){

	console.log(rows);
	console.log("Total # of taxis: " + rows.length);
	rows.forEach(function (row, index) {
		
		var pickup_pos = [row.pickup_longitude, row.pickup_latitude];
		var dropoff_pos = [row.dropoff_longitude, row.dropoff_latitude];

		total_time = (new Date(row.dropoff_datetime)) - (new Date(row.pickup_datetime));

		
		function calcSpread(one, two) {
			var two_millis = two.valueOf();
			var one_millis = one.valueOf();

			console.log(one);
			console.log(two);

			return two_millis - one_millis;
		}

		function removeFrame(frame_index,id_num,color){

			var frame_to_delete_index = frame_index + delete_after_frames;

			if (frame_to_delete_index > delta) { frame_to_delete_index = delta };

			for (var i = 0; i < delete_after_frames; i++) {
				
				var frame_to_change_index = frame_index + i;
				var new_radius = dot_radius * (1 - i / delete_after_frames);

				if (frames[frame_to_change_index] == null) { frames[frame_to_change_index] = [];};
				frames[frame_to_change_index].push({
					kind: 'change',
					id_num: id_num,
					radius: new_radius,
					color: color
				});

			};

			if (frames[frame_to_delete_index] == null) { frames[frame_to_delete_index] = [];};
			frames[frame_to_delete_index].push({
				kind: 'delete',
				id_num: id_num,
				color: color
			});

		}

		function addFrame(position,time,kind) {
			
			var color = '#FF0';
			if (kind == 'dropoff') { color = '#F00'};
			var spread = calcSpread(now,moment(time));
			var id_num = makeid(8);

			if (spread > 0) {
				
				var frame_index = Math.round(Math.round(spread / 1000) / real_seconds_per_frame);
				console.log(frame_index);
				if (frames[frame_index] == null) { frames[frame_index] = [];};
				frames[frame_index].push({
					coordinates: position,
					kind: kind,
					id_num: id_num,
					color: color
				});

				removeFrame(frame_index,id_num,color);

			}
		}

		

		addFrame(pickup_pos,row.pickup_datetime,'pickup');
		addFrame(dropoff_pos,row.dropoff_datetime,'dropoff');
		
		// map.addSource('point-'+index, {
		//     "type": "geojson",
		//     "data": taxi.point
		// });

		// map.addLayer({
		//     "id": "point-" + index,
		//     "source": "point-" + index,
		//     "type": "circle",
		//     "paint": {
		//         "circle-radius": 5,
		//         "circle-color": "#FF0"
		//     }
		// });

		// requestAnimationFrame(taxi.animate);

		console.log("loaded taxi #" + (index + 1));
	
	});

	console.log(frames)

	requestAnimationFrame(animate);

}

var counter = 0;
var fps = 15;
var fps_now = 0;
var fps_then = moment();
var fps_interval = 1000/fps;
var fps_delta = 0;

function animate() {

	fps_now = moment();
	fps_delta = fps_now.valueOf() - fps_then.valueOf();

	if (fps_delta > fps_interval) {

		if (counter < delta) {

			

			fps_then = moment(fps_now.valueOf() - (fps_delta % fps_interval));

			realTime = realTime.add(real_seconds_per_frame,'seconds');
			$(".display-time").text(realTime.format("h:mm a"));

			var frame = frames[counter];



			if (frame != undefined) {

				console.log("displaying frame: " + counter);
				console.log("  # of events in frame: " + frame.length);

				frame.forEach(function (e, index) {
					if (e.kind == 'delete') {
						map.removeLayer(e.id_num);
						map.removeSource(e.id_num);
					} else if (e.kind == 'pickup' || e.kind == 'dropoff') {

						point.features[0].geometry.coordinates = e.coordinates;

						map.addSource(e.id_num, {
							"type": "geojson",
							"data": point
						});

						map.addLayer({
							"id": e.id_num,
							"source": e.id_num,
							"type": "circle",
							"paint": {
								"circle-radius": dot_radius,
								"circle-color": e.color
							}
						});
					} else if (e.kind == 'change') {

						map.removeLayer(e.id_num);
						map.addLayer({
							"id": e.id_num,
							"source": e.id_num,
							"type": "circle",
							"paint": {
								"circle-radius": e.radius,
								"circle-color": e.color
							}
						});
					}
				});
			}

			counter++;
		}

	}

	requestAnimationFrame(animate);

}

function makeid(len)
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < len; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}









