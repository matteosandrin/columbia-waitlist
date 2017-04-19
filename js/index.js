$(document).ready(function() {
	$('#fullpage').fullpage({
		sectionsColor: ['#1bbc9b', '#4BBFC3', '#7BAABE', 'black', 'whitesmoke', '#B42A43', '#B42A43','#20457C'],
		anchors: ['welcome', 'data', 'columbia', 'taxis','photography', 'travel', 'site', 'attend'],
		scrollingSpeed: 500,
		navigation: true,
		autoScrolling: false,
		onLeave: function (index, nextIndex, direction) {
			if (index == 3 && nextIndex == 4 && $(".replay-button").text() == "Play" && $(".replay-button").css("opacity") == 1) { // the next slide is the taxi visualisation
				$(".replay-button").click();
			}
			console.log("going from section " + index + " to section " + nextIndex);
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
	$('.graph-frame').load("post-data/visualizing-students/connecting-classes-graph.html");
	$('.taxis-map-wrapper').load("post-data/visualizing-taxis/taxis.html");
});