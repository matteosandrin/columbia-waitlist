var bounds_poly = [[-73.949313, 40.807673],
				   [-73.965538, 40.814000],
				   [-73.971439, 40.807532],
				   [-73.954771, 40.800006]]
var sw_corner = [-73.968180, 40.800455]; // [longitude, latitude]
var ne_corner = [-73.951700, 40.813548]; // [longitude, latitude]

var columbia_center = [-73.961906,40.808210];
var columbia_map_bounds = [sw_corner,ne_corner];

var pickup_color = '#D73224';
var dropoff_color = '#3778FA';
var tally = {
	pickup: 0,
	dropoff: 0
};

var real_seconds_per_frame = 20;
var delta = 2 * 60 * 60 / real_seconds_per_frame;
var delete_after_frames = 5;
var dot_radius = 10;
var now = moment().year(2015);
var then = moment().year(2015).add(delta * real_seconds_per_frame, 'seconds');
var realTime = moment(now.valueOf());

$(".display-date").text(realTime.format("MMMM Do YYYY"));
$(".display-time").text(realTime.format("h:mm a"));
$(".display-status").text("Downloading tiles from Mapbox...");

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
		zoom: 16,
		center: columbia_center,
		interactive: false,
		bearing: 29.1
		});

map.on('load', function () {

	$(".mapboxgl-canvas").css('width',"100%");
	$(".mapboxgl-canvas").css('height',"100%");

	map.resize();

	$(".display-status").text("Downloading taxi trips from NYC Open Data...");

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
	  .getRows()
		.on('success', drawRows)
		.on('error', function(error) { console.error(error); });

});

function drawRows(rows){

	console.log("Total # of taxis: " + rows.length);

	processLargeArrayAsync(rows, processTaxi);

	function processTaxi (row, index) {
		
		var pickup_pos = [row.pickup_longitude, row.pickup_latitude];
		var dropoff_pos = [row.dropoff_longitude, row.dropoff_latitude];

		total_time = (new Date(row.dropoff_datetime)) - (new Date(row.pickup_datetime));

		
		function calcSpread(one, two) {
			var two_millis = two.valueOf();
			var one_millis = one.valueOf();

			return two_millis - one_millis;
		}

		function removeFrame(frame_index,id_num,color){

			var frame_to_delete_index = frame_index + delete_after_frames;

			if (frame_to_delete_index >= delta) { frame_to_delete_index = delta - 1 };

			if (frames[frame_to_delete_index] == null) { frames[frame_to_delete_index] = [];};
			frames[frame_to_delete_index].push({
				kind: 'delete',
				id_num: id_num
			});

		}

		function addFrame(position,time,kind) {
			
			var color = pickup_color;
			if (kind == 'dropoff') { color = dropoff_color };
			var spread = calcSpread(now,moment(time));
			var id_num = makeid(8);
			// var within_bounds = position[0] > sw_corner [0] && position[0] < ne_corner[0] && position[1] > sw_corner [1] && position[1] < ne_corner[1];
			var within_bounds = inside(position,bounds_poly);

			if (spread > 0 && spread <= delta * real_seconds_per_frame * 1000 && within_bounds) {
				
				var frame_index = Math.round(Math.round(spread / 1000) / real_seconds_per_frame);
				
				if (frames[frame_index] == null) { frames[frame_index] = [];};
				frames[frame_index].push({
					kind: kind,
					id_num: id_num,
					color: color
				});

				point.features[0].geometry.coordinates = position;

				map.addSource(id_num, {
					"type": "geojson",
					"data": point
				});

				map.addLayer({
					"id": id_num,
					"source": id_num,
					"type": "circle",
					"paint": {
						"circle-radius": dot_radius,
						"circle-color": color
					},
					"layout": {
						"visibility": "none"
					}
				});

				removeFrame(frame_index,id_num,color);

			}
		}	

		addFrame(pickup_pos,row.pickup_datetime,'pickup');
		addFrame(dropoff_pos,row.dropoff_datetime,'dropoff');
	
	}

	$(".loading-container").css('opacity',0);
	$(".map-overlay").css('opacity',1);
	$(".replay-button").text('Play');
	$(".replay-button").css('opacity',1);
	$(".replay-button").css('cursor','pointer');
	$(".replay-button").removeAttr('disabled');

}

var counter = 0;
var fps = 10;
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

			realTime.add(real_seconds_per_frame,'seconds');
			$(".display-time").text(realTime.format("h:mm a"));
			$(".display-pickups").text();

			var frame = frames[counter];

			if (frame != undefined) {

				frame.forEach(function (e, index) {
					if (e.kind == 'delete') {
						try {
							map.setLayoutProperty(e.id_num,"visibility","none");
						} catch(error) {
							console.log("Failed to delete layer: " + e.id_num);
						}
					} else if (e.kind == 'pickup' || e.kind == 'dropoff') {

						tally[e.kind] += 1;
						map.setPaintProperty(e.id_num, 'circle-radius', dot_radius);
						map.setLayoutProperty(e.id_num,"visibility","visible");

					} 
				});
			}

			$(".display-pickups").text(tally.pickup + " pickups");
			$(".display-dropoffs").text(tally.dropoff + " dropoffs");

			counter++;
		} else {
			$(".replay-button").css('opacity',1);
			$(".replay-button").css('cursor','pointer');
			$(".replay-button").removeAttr('disabled');
		}

	}

	requestAnimationFrame(animate);

}

function makeid(len)
{

	// http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript

	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < len; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function replay() {
	$(".replay-button").css('opacity',0);
	$(".replay-button").css('cursor','initial');
	$(".replay-button").prop('disabled', true);
	$(".replay-button").text('Replay');
	counter = 0;
	tally.pickup = 0;
	tally.dropoff = 0;
	fps_then = moment();
	realTime = moment(now.valueOf());
	requestAnimationFrame(animate);
}

function inside(point, vs) {
    
    // http://stackoverflow.com/questions/22521982/js-check-if-point-inside-a-polygon
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

function processLargeArrayAsync(array, fn, chunk, context) {

	// http://stackoverflow.com/questions/10344498/best-way-to-iterate-over-an-array-without-blocking-the-ui

    context = context || window;
    chunk = chunk || 10;
    var index = 0;
    function doChunk() {
        var cnt = chunk;
        while (cnt-- && index < array.length) {
            // callback called with args (value, index, array)
            fn.call(context, array[index], index);
            ++index;
        }
        if (index < array.length) {
            // set Timeout for async iteration
            setTimeout(doChunk, 1);
        }
    }    
    doChunk();    
}