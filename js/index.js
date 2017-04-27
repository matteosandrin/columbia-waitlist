$(document).ready(function() {
	$('#fullpage').fullpage({
		sectionsColor: ['#4BBFC3', '#1bbc9b', '#7BAABE', 'black', 'whitesmoke', '#B42A43', '#B42A43','#20457C', '#1bbc9b'],
		anchors: ['welcome', 'data', 'columbia', 'taxis','photography', 'travel', 'site', 'attend', 'finale'],
		scrollingSpeed: 500,
		navigation: true,
		autoScrolling: false,
		onLeave: function (index, nextIndex, direction) {
			if (index == 3 && nextIndex == 4 && $(".replay-button").text() == "Play" && $(".replay-button").css("opacity") == 1) { // the next slide is the taxi visualisation
				$(".replay-button").click();
			}
		}
	});

});

window.addEventListener('keydown', function (key) {
	switch (key.keyCode) {
		case 38: $.fn.fullpage.moveSectionUp();		break; //arrow up
		case 40: $.fn.fullpage.moveSectionDown();	break; //arrow down
	}
});

$(document).ready(function(){
	if (window.location.host.search("localhost") != -1) {
		var payload = {
			"app_id": "d920c173-d56e-43cd-bb87-fe8e9b461602",
			"included_segments": ["All"],
			"template_id": "5f5a37de-5579-4eec-ba8f-6252c50757cb"
		}

		var request = new XMLHttpRequest();
		request.open('POST', "https://onesignal.com/api/v1/notifications", true);
		request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		request.setRequestHeader("Authorization", "Basic MjJhNzdlYWQtNzcyMS00OWEyLWJkNzUtMDljNDZmMzg1YzNm");
		request.send(JSON.stringify(payload));
		console.log("push");
	}
	$('.graph-frame').load("post-data/visualizing-students/connecting-classes-graph.html");
	$('.taxis-map-wrapper').load("post-data/visualizing-taxis/taxis.html");
});